// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { boundedOperation } from "./bounded-operation.js";
import { packNpm } from "./pack-npm.mjs";

test("npm delivery preserves binary offsets and refuses wrong versions or links", () => {
  const root = mkdtempSync(join(tmpdir(), "academy-npm-format-"));
  try {
    mkdirSync(join(root, "bin"));
    writeFileSync(join(root, "package.json"), '{"name":"npm","version":"10.9.2"}');
    writeFileSync(join(root, "bin/npm-cli.js"), "format fixture only");
    writeFileSync(join(root, "binary"), Buffer.from([0, 255, 13, 10]));
    const output = join(tmpdir(), `academy-npm-${root.split("/").at(-1)}.bin`);
    try {
      const result = packNpm(root, output);
      assert.equal(result.version, "10.9.2");
      const raw = gunzipSync(readFileSync(output));
      const length = raw.readUInt32LE(0);
      const header = JSON.parse(raw.subarray(4, 4 + length).toString());
      assert.equal(header.version, "10.9.2");
      assert.equal(header.files.length, 3);
      for (const file of header.files)
        assert.deepEqual(
          raw.subarray(4 + length + file.o, 4 + length + file.o + file.l),
          readFileSync(join(root, file.p)),
        );
      writeFileSync(join(root, "package.json"), '{"name":"npm","version":"0.0.0"}');
      assert.throws(() => packNpm(root, output), /expected real npm@10.9.2/);
      writeFileSync(join(root, "package.json"), '{"name":"npm","version":"10.9.2"}');
      symlinkSync(join(root, "binary"), join(root, "unexpected-link"));
      assert.throws(() => packNpm(root, output), /unsupported npm entry/);
    } finally {
      rmSync(output, { force: true });
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("operation deadline rejects a never-settled SDK request", async () => {
  assert.equal(await boundedOperation(Promise.resolve(7), "finite", 100), 7);
  await assert.rejects(
    boundedOperation(new Promise(() => {}), "stalled", 5),
    /stalled deadline exceeded/,
  );
});
