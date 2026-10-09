// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 11: production carries no development surface. In development this build mounts the
// reload stream and script, under the devtools prefix; the devtools themselves are mounted only
// for a server handed them, which `dev` does and this build is not. In production nothing under
// the prefix answers, for any method, and no page links the script; the same build started in
// development serves and links the script, so the absence is the mode's and not the build's.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { originOf, rootOf, started } from "../http.mjs";

const open = originOf("open");
const at = (path, init) => fetch(new URL(path, open), init);
const RELOAD = ["/_assemblejs/devtools/reload", "/_assemblejs/devtools/reload.js"];
const DEVTOOLS = ["/_assemblejs/devtools/", "/_assemblejs/devtools/project.json"];
const asStream = { headers: { accept: "text/event-stream" } };

test("nothing under the devtools prefix answers, for any method", async () => {
  for (const path of [...RELOAD, ...DEVTOOLS]) {
    for (const method of ["GET", "POST", "DELETE"]) {
      const response = await at(path, { method, ...asStream });
      assert.equal(response.status, 404, `${method} ${path}`);
      assert.equal(typeof (await response.json()).error?.correlationId, "string", path);
    }
  }
});

test("a page links no reload script and carries no boot", async () => {
  const page = await (await at("/")).text();
  assert.ok(!page.includes("/_assemblejs/devtools/"), page);
  assert.ok(!page.includes("boot="), page);
});

test("the server said it runs in production", () => {
  const log = readFileSync(process.env.CONFORMANCE_LOG_OPEN ?? "", "utf8");
  assert.match(log, /^mode {2}production$/m);
});

test("the same build in development serves the reload stream and script and links the script, so the absence is the mode's", async () => {
  const server = await started(rootOf("open"), {
    ASSEMBLEJS_MODE: "development",
    GUARDED_ORIGIN: originOf("guarded"),
  });
  try {
    assert.ok(server.origin !== undefined, server.output());
    const script = await fetch(new URL("/_assemblejs/devtools/reload.js", server.origin));
    assert.equal(script.status, 200);
    assert.match(script.headers.get("content-type") ?? "", /javascript/);
    const controller = new AbortController();
    const stream = await fetch(new URL("/_assemblejs/devtools/reload", server.origin), {
      ...asStream,
      signal: controller.signal,
    });
    assert.equal(stream.status, 200);
    assert.match(stream.headers.get("content-type") ?? "", /^text\/event-stream/);
    controller.abort();
    const page = await (await fetch(new URL("/", server.origin))).text();
    assert.match(page, /\/_assemblejs\/devtools\/reload\.js\?boot=/);
    // The devtools were never handed to this build, so they are absent in either mode.
    for (const path of DEVTOOLS) {
      assert.equal((await fetch(new URL(path, server.origin))).status, 404, path);
    }
  } finally {
    await server.stop();
  }
});
