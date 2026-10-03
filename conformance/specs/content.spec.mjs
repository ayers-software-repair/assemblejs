// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 2.1: the content endpoint.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { attributesOf, get } from "./contract.mjs";

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
    { "assembly-path": "not,uuids" },
  ]) {
    const response = await get("/assembly/cart/", headers);
    assert.equal(response.status, 400, JSON.stringify(headers));
  }
});

test("answers 404 for an assembly or a view that does not exist", async () => {
  assert.equal((await get("/assembly/nowhere/")).status, 404);
  assert.equal((await get("/assembly/cart/nowhere/")).status, 404);
});
