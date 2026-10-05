// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 5.3 and 5.2, with no control on: the island carries six named fields and nothing of the
// request; the default policy is on every html answer and no other, naming this origin and the
// declared remote and nothing inline; same origin by default; every answer refuses sniffing.
import assert from "node:assert/strict";
import { test } from "node:test";
import { islandOf, originOf } from "../http.mjs";

const open = originOf("open");
const guarded = originOf("guarded");
const at = (path, init) => fetch(new URL(path, open), init);
const SIX = ["data", "deferred", "id", "name", "renderer", "view"];
const JSON_ANSWERS = [
  "/api/time",
  "/assembly/greeting/default/api/",
  "/assembly/greeting/default/manifest/",
];

test("the island carries exactly the six named fields, in a page and on the content endpoint", async () => {
  for (const path of ["/", "/assembly/greeting/"]) {
    const island = islandOf(await (await at(path)).text());
    assert.deepEqual(Object.keys(island.payload).sort(), SIX, path);
    assert.equal(island.payload.id, island.id, "addressed by its own id");
    assert.equal(island.payload.name, "greeting");
    assert.equal(island.payload.view, "default");
    assert.equal(island.payload.renderer, "html");
    assert.equal(island.payload.deferred, false);
    assert.deepEqual(island.payload.data, { audience: "everyone" });
  }
});

const told = () =>
  at("/?token=secret-query", {
    headers: {
      cookie: "session=secret-cookie",
      "x-visitor": "secret-header",
      authorization: "Bearer secret-token",
    },
  });

for (const [carried, secret] of [
  ["the query", "secret-query"],
  ["a cookie", "secret-cookie"],
  ["a header's value", "secret-header"],
  ["a header's name", "x-visitor"],
  ["a credential", "secret-token"],
]) {
  test(`nothing of the request reaches the page: not ${carried}`, async () => {
    const page = await (await told()).text();
    assert.match(page, /hello, whoever you are/);
    assert.ok(!page.includes(secret), secret);
  });
}

const policyOf = async (path) => {
  const policy = (await at(path)).headers.get("content-security-policy") ?? "";
  const directives = Object.fromEntries(
    policy
      .split(";")
      .map((directive) => directive.trim().split(/\s+/))
      .map(([name, ...sources]) => [name, sources]),
  );
  return { policy, directives };
};

test("the default policy is on every html answer, naming this origin and the declared remote", async () => {
  for (const path of ["/", "/assembly/greeting/"]) {
    const { policy, directives } = await policyOf(path);
    assert.deepEqual(directives["default-src"], ["'self'"], policy);
    assert.deepEqual(directives["script-src"], ["'self'", guarded], policy);
    assert.deepEqual(directives["style-src"], ["'self'", guarded], policy);
    assert.deepEqual(directives["connect-src"], ["'self'", guarded], policy);
  }
});

test("the default policy lets nothing inline run or apply, allows no plugin, and names no wildcard", async () => {
  for (const path of ["/", "/assembly/greeting/"]) {
    const { policy, directives } = await policyOf(path);
    assert.deepEqual(directives["object-src"], ["'none'"], policy);
    assert.ok(!policy.includes("unsafe-inline"), policy);
    assert.ok(!policy.includes("unsafe-eval"), policy);
    assert.ok(!policy.includes("*"), policy);
  }
});

test("a JSON answer carries no page policy", async () => {
  for (const path of JSON_ANSWERS) {
    assert.equal((await at(path)).headers.get("content-security-policy"), null, path);
  }
});

test("same origin by default: a page from another origin is granted neither the page, the data nor an api", async () => {
  for (const path of ["/", "/assembly/greeting/", ...JSON_ANSWERS]) {
    const response = await at(path, { headers: { origin: "https://elsewhere.example" } });
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get("access-control-allow-origin"), null, path);
    assert.equal(response.headers.get("access-control-allow-credentials"), null, path);
  }
});

test("same origin by default: a preflight from another origin is granted nothing", async () => {
  const preflight = await at("/api/time", {
    method: "OPTIONS",
    headers: { origin: "https://elsewhere.example", "access-control-request-method": "GET" },
  });
  assert.ok(!preflight.ok, `a preflight nothing granted is not a success: ${preflight.status}`);
  for (const header of [...preflight.headers.keys()]) {
    assert.ok(!header.startsWith("access-control-"), header);
  }
});

test("every answer refuses sniffing", async () => {
  for (const path of ["/", "/assembly/greeting/", ...JSON_ANSWERS, "/no/such/thing"]) {
    assert.equal((await at(path)).headers.get("x-content-type-options"), "nosniff", path);
  }
});
