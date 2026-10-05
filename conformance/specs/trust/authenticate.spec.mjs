// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 5.2, under the product's own check: it decides in the same one place, with no basic
// challenge; a check that throws refuses; a declared public route needs no check; a project's
// policy replaces the default whole; and both controls on is a boot refusal, as one place decides.
import assert from "node:assert/strict";
import { test } from "node:test";
import { logged, originOf, rootOf, started } from "../http.mjs";

const checked = originOf("checked");
const at = (path, team) =>
  fetch(new URL(path, checked), { headers: team === undefined ? {} : { "x-team": team } });
const DECLARED = "default-src 'self'; script-src 'self' https://cdn.example.com";

test("the check refuses without what it reads, with no basic challenge, and admits with it", async () => {
  const refused = await at("/");
  assert.equal(refused.status, 401);
  assert.equal(refused.headers.get("www-authenticate"), null);
  const { correlationId } = (await refused.json()).error;
  assert.equal(typeof correlationId, "string");
  assert.equal(await logged(correlationId, "checked"), false, "a refusal is not a failure");
  assert.equal(
    (await at("/", "visitors")).status,
    401,
    "the check reads the value, not the header",
  );
  const admitted = await at("/", "shop");
  assert.equal(admitted.status, 200);
  assert.match(await admitted.text(), /checked by the product/);
  assert.equal((await at("/assembly/hello/", "shop")).status, 200);
});

test("a check that throws refuses, and its exception is logged against the id the visitor was told", async () => {
  const refused = await at("/", "boom");
  assert.equal(refused.status, 401);
  const body = await refused.text();
  assert.ok(!body.includes("the check broke"), "the exception reaches no body");
  assert.equal(await logged(JSON.parse(body).error.correlationId, "checked"), true);
});

test("a declared public route needs no check", async () => {
  assert.equal((await at("/api/open")).status, 200);
});

test("the project's own policy replaces the default on every html answer, as written", async () => {
  for (const path of ["/", "/assembly/hello/"]) {
    assert.equal((await at(path, "shop")).headers.get("content-security-policy"), DECLARED, path);
  }
  assert.equal((await at("/api/open")).headers.get("content-security-policy"), null);
});

test("basic credentials and a check together refuse to boot: one place decides", async () => {
  const server = await started(rootOf("checked"), {
    ASSEMBLEJS_MODE: "production",
    ASSEMBLEJS_AUTH: "basic",
    ASSEMBLEJS_AUTH_USER: "lovelace",
    ASSEMBLEJS_AUTH_PASSWORD: "open-sesame",
  });
  try {
    assert.equal(server.origin, undefined, "it listened");
    assert.notEqual(await server.exit(), 0);
    assert.match(server.output(), /one place decides/);
  } finally {
    await server.stop();
  }
});
