// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 5.2, under basic credentials: one decision before anything else refuses every kind of
// route without them and lets every kind through with them; health, the built browser files and
// the declared public routes need none; and a credential never reaches a body.
import assert from "node:assert/strict";
import { test } from "node:test";
import { originOf } from "../http.mjs";

const guarded = originOf("guarded");
const at = (path, init = {}) => fetch(new URL(path, guarded), init);
const credentials = `Basic ${Buffer.from("lovelace:open-sesame").toString("base64")}`;
const signed = (path, init = {}) =>
  at(path, { ...init, headers: { ...(init.headers ?? {}), authorization: credentials } });

const KINDS = [
  ["a page", "/"],
  ["an assembly's content", "/assembly/badge/"],
  ["an assembly's data", "/assembly/badge/default/api/"],
  ["an assembly's manifest", "/assembly/badge/default/manifest/"],
  ["an api", "/api/closed"],
  ["a stream", "/api/ticks"],
];
const asStream = { headers: { accept: "text/event-stream" } };

for (const [kind, path] of KINDS) {
  test(`${kind} is refused without credentials: a challenge, and the failure body alone`, async () => {
    const refused = await at(path, asStream);
    assert.equal(refused.status, 401);
    assert.match(refused.headers.get("www-authenticate") ?? "", /^Basic realm=/);
    const body = await refused.text();
    const failure = JSON.parse(body);
    assert.deepEqual(Object.keys(failure), ["error"]);
    assert.equal(typeof failure.error.correlationId, "string");
    for (const held of ["badge", "member", "lovelace", "open-sesame"]) {
      assert.ok(!body.includes(held), `${held} in ${body}`);
    }
  });

  test(`${kind} answers with them`, async () => {
    const controller = new AbortController();
    const allowed = await signed(path, { ...asStream, signal: controller.signal });
    assert.equal(allowed.status, 200);
    if (path === "/api/ticks") controller.abort();
    else await allowed.text();
  });
}

test("an unknown path is refused before it is matched", async () => {
  assert.equal((await at("/no/such/thing")).status, 401);
  assert.equal(
    (await signed("/no/such/thing")).status,
    404,
    "with credentials, the router sees it",
  );
});

test("the decision comes before the body is read: a malformed body is refused as a body only once admitted", async () => {
  const malformed = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{ not json",
  };
  assert.equal((await at("/api/submit", malformed)).status, 401);
  assert.equal((await signed("/api/submit", malformed)).status, 400, "admitted, the body is read");
  const accepted = await signed("/api/submit", {
    ...malformed,
    body: JSON.stringify({ sku: "a1" }),
  });
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { received: { sku: "a1" } });
});

test("health needs no credentials, so a load balancer can always read it", async () => {
  const health = await at("/_assemblejs/health");
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");
});

const assets = async () => {
  const manifest = await (await signed("/assembly/badge/default/manifest/")).json();
  assert.equal(manifest.assets.js.length, 1, JSON.stringify(manifest.assets));
  assert.equal(manifest.assets.css.length, 1, JSON.stringify(manifest.assets));
  return [...manifest.assets.js, ...manifest.assets.css];
};

test("the built browser files need no credentials", async () => {
  for (const asset of await assets()) {
    assert.equal((await fetch(new URL(asset, guarded))).status, 200, asset);
  }
});

test("the built browser files are served to any origin, as a page elsewhere loads them", async () => {
  for (const asset of await assets()) {
    const response = await fetch(new URL(asset, guarded));
    assert.equal(response.headers.get("access-control-allow-origin"), "*", asset);
  }
});

test("a declared public route needs none: the exact one exactly, the prefix for all under it", async () => {
  assert.equal((await at("/api/open")).status, 200);
  assert.equal((await at("/api/open/")).status, 401, "exact means exact");
  const notice = await at("/public/notice");
  assert.equal(notice.status, 200);
  const page = await notice.text();
  assert.match(page, /open to anyone/);
  assert.match(page, /<assembly-root\b[^>]*data-name="badge"/, "placed without credentials too");
  assert.equal(
    (await at("/public/nothing-here")).status,
    404,
    "let through to the router, which has nothing there",
  );
});

test("a credential reaches no body: not a page's, not a refusal's", async () => {
  const page = await (await signed("/")).text();
  assert.match(page, /for members only/);
  for (const secret of ["open-sesame", credentials.slice("Basic ".length)]) {
    assert.ok(!page.includes(secret), secret);
  }
  assert.ok(!(await (await at("/")).text()).includes("lovelace"));
});
