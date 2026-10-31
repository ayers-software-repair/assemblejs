// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { test } from "node:test";
import { readSaveBody } from "./read-save-body.mjs";

test("split UTF-8 source bytes survive the save request exactly", async () => {
  const value = { before: "old", after: "Café € 茶" };
  const bytes = Buffer.from(JSON.stringify(value));
  const chunks = Array.from(bytes, (byte) => Buffer.from([byte]));
  assert.deepEqual(await readSaveBody(Readable.from(chunks)), value);
});

test("oversized, invalid and non-text save requests are refused", async () => {
  for (const body of ["broken", "null", '{"before":"a","after":2}', " ".repeat(256001)])
    await assert.rejects(readSaveBody(Readable.from([Buffer.from(body)])));
});
