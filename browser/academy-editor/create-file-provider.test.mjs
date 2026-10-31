// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createFileProvider } from "./create-file-provider.js";

const fetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetch;
});

test("a successful save waits for the response body before resolving", async () => {
  let release;
  let consumed = false;
  const body = new Promise((resolve) => {
    release = resolve;
  });
  globalThis.fetch = async (_url, request) => {
    assert.deepEqual(JSON.parse(request.body), { before: "before", after: "after" });
    return {
      ok: true,
      text: async () => {
        consumed = true;
        return body;
      },
    };
  };
  let saved = false;
  const saving = createFileProvider()
    .writeFile("view.tsx", "after", "before")
    .then(() => {
      saved = true;
    });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(consumed, true);
  assert.equal(saved, false);
  release("saved");
  await saving;
  assert.equal(saved, true);
});

test("failed writes retain the actual provider diagnostic", async () => {
  globalThis.fetch = async () => new Response("outside edit kept", { status: 409 });
  await assert.rejects(
    createFileProvider().writeFile("view.tsx", "after", "before"),
    /outside edit kept/,
  );
});

test("a successful HTTP status without the save acknowledgement is refused", async () => {
  globalThis.fetch = async () => new Response("unexpected page", { status: 200 });
  await assert.rejects(
    createFileProvider().writeFile("view.tsx", "after", "before"),
    /acknowledgement missing/,
  );
});
