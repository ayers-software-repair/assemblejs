// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 2.1: the content endpoint.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { attributesOf, get } from "../http.mjs";

test("answers 200 with an html fragment that is exactly one envelope", async () => {
  const response = await get("/assembly/cart/");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/html; charset=utf-8");
  const body = (await response.text()).trim();
  assert.match(body, /^<assembly-root\b[^>]*>[\s\S]*<\/assembly-root>$/);
  assert.equal(body.match(/<assembly-root\b/g)?.length, 1);
  for (const document of ["<html", "<head", "<body", "<!doctype"]) {
    assert.ok(!body.toLowerCase().includes(document), `a fragment has no ${document}`);
  }
});

test("serves the default view at its own path too", async () => {
  const response = await get("/assembly/cart/default/");
  assert.equal(response.status, 200);
  assert.equal(attributesOf(await response.text())["data-view"], "default");
});

test("echoes the assembly it served and the version of its output", async () => {
  const response = await get("/assembly/cart/");
  assert.equal(response.headers.get("assembly-name"), "cart");
  assert.ok((response.headers.get("assembly-version") ?? "") !== "");
});

test("stamps the id the parent allocated on its envelope and its island", async () => {
  const id = randomUUID();
  const body = await (
    await get("/assembly/cart/", { "assembly-id": id, "assembly-page": randomUUID() })
  ).text();
  assert.equal(attributesOf(body)["data-id"], id);
  assert.ok(body.includes(`data-assembly="${id}"`));
});

test("refuses a malformed composition header with 400, rather than coercing it", async () => {
  for (const headers of [
    { "assembly-id": "not-a-uuid" },
    { "assembly-page": "not-a-uuid" },
    { "assembly-depth": "two" },
    { "assembly-depth": "9999" },
    { "assembly-path": "not,identities" },
    // An instance's id is new on every render, so it can never name a cycle: the path is
    // ancestors' identities, never their ids.
    { "assembly-path": randomUUID() },
  ]) {
    const response = await get("/assembly/cart/", headers);
    assert.equal(response.status, 400, JSON.stringify(headers));
  }
});

test("accepts the composition headers a parent sends, the path its ancestors' identities", async () => {
  const response = await get("/assembly/cart/", {
    "assembly-page": randomUUID(),
    "assembly-id": randomUUID(),
    "assembly-depth": "2",
    "assembly-path": "home-hero/default,product-card/compact",
  });
  assert.equal(response.status, 200);
});

test("refuses on arrival a request whose ancestors already include this assembly (DESIGN 3.4)", async () => {
  for (const path of ["cart/default", "home/default,cart/default"]) {
    const response = await get("/assembly/cart/", { "assembly-path": path });
    assert.equal(response.status, 400, path);
  }
  const another = await get("/assembly/cart/", { "assembly-path": "home/default,cart/compact" });
  assert.equal(another.status, 200, "the same assembly in another view is another identity");
});

test("answers 404 for an assembly or a view that does not exist", async () => {
  assert.equal((await get("/assembly/nowhere/")).status, 404);
  assert.equal((await get("/assembly/cart/nowhere/")).status, 404);
});

// A view is one its assembly wrote. Every object answers to these names, and a server that
// read a view through the object answered each of them with something.
test("answers 404 for a view named after what every object has, at each endpoint", async () => {
  for (const view of ["constructor", "toString", "valueOf", "__proto__"]) {
    for (const endpoint of ["", "api/", "manifest/"]) {
      const path = `/assembly/cart/${view}/${endpoint}`;
      assert.equal((await get(path)).status, 404, path);
    }
  }
});

test("answers a url that is not one with 400 and the failure body, the url nowhere in it", async () => {
  for (const path of ["/assembly/cart/%zz/", "/%"]) {
    const response = await get(path);
    assert.equal(response.status, 400, path);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff", path);
    const body = await response.text();
    assert.deepEqual(Object.keys(JSON.parse(body)), ["error"], path);
    assert.deepEqual(Object.keys(JSON.parse(body).error), ["correlationId"], path);
    assert.ok(!body.includes("%"), path);
  }
});
