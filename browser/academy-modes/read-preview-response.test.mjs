// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { readPreviewResponse } from "./read-preview-response.mjs";

test("preview response bytes are decoded across split UTF-8 chunks", async () => {
  const bytes = new TextEncoder().encode("Coffee café");
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.slice(0, 11));
      controller.enqueue(bytes.slice(11));
      controller.close();
    },
  });
  assert.equal(await readPreviewResponse(new Response(stream), bytes.length), "Coffee café");
});
test("oversized preview streams are cancelled and empty bodies refuse", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(8));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(readPreviewResponse(new Response(stream), 7), /exceeds/);
  assert.equal(cancelled, true);
  await assert.rejects(readPreviewResponse(new Response(null), 7), /no response body/);
});

test("errored response streams release their lock even when cancellation rejects", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.error(new Error("actual stream failed"));
    },
  });
  const response = new Response(stream);
  await assert.rejects(readPreviewResponse(response, 16), /actual stream failed/);
  assert.equal(response.body.locked, false);
});
