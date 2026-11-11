// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { previewShimHashes } from "./preview-shim-hashes.mjs";

test("only four explicit static SDK shims receive CSP hashes", async () => {
  const source =
    'const NET_SHIM = "line\\nnext"; const TITLE_SHIM = `title`; const WS_SHIM = "ws"; const SSE_SHIM = "sse";';
  const values = ["line\nnext", "title", "ws", "sse"];
  assert.deepEqual(
    previewShimHashes(source),
    values.map((value) => `'sha256-${createHash("sha256").update(value).digest("base64")}'`),
  );
  assert.throws(
    () => previewShimHashes(source.replace('const SSE_SHIM = "sse";', "")),
    /incomplete/,
  );
  assert.throws(() => previewShimHashes(source.replace('"ws"', "build()")), /static string/);
  assert.throws(() => previewShimHashes(source + ' const NET_SHIM="other";'), /duplicate/);
  const root = dirname(fileURLToPath(import.meta.resolve("@vivari/core")));
  const actual = previewShimHashes(await readFile(join(root, "assets/sw.js"), "utf8"));
  assert.equal(actual.length, 4);
  assert.equal(new Set(actual).size, 4);
});
