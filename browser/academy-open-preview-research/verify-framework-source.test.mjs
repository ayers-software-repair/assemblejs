// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { verifyFrameworkSource } from "./verify-framework-source.js";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const fixture = () => {
  const metadata = Buffer.from('{"name":"@asmjs/core","version":"unit"}');
  const index = Buffer.from("export const unit = true;");
  const chunk = Buffer.from("export const shared = 1;");
  const files = new Map([
    ["/app/node_modules/@asmjs/core/package.json", metadata],
    ["/app/node_modules/@asmjs/core/dist/index.js", index],
    ["/app/node_modules/@asmjs/core/dist/chunks/shared.js", chunk],
  ]);
  const inventory = {
    packages: [
      {
        name: "@asmjs/core",
        version: "unit",
        metadataSha256: digest(metadata),
        moduleHashes: { "index.js": digest(index), "chunks/shared.js": digest(chunk) },
      },
    ],
  };
  const runtime = {
    fs: {
      exists: async () => false,
      readdir: async () => ["core"],
      readFile: async (path) => {
        assert.ok(files.has(path));
        return files.get(path);
      },
    },
  };
  return { files, inventory, runtime };
};

test("verifies actual installed metadata and every JavaScript module, not just the entry", async () => {
  const { runtime, inventory } = fixture();
  assert.deepEqual(await verifyFrameworkSource(runtime, inventory, "/app"), [
    { name: "@asmjs/core", version: "unit", files: inventory.packages[0].moduleHashes },
  ]);
});

test("refuses a changed split chunk even when entry bytes and package version match", async () => {
  const { runtime, inventory, files } = fixture();
  files.set("/app/node_modules/@asmjs/core/dist/chunks/shared.js", Buffer.from("changed"));
  await assert.rejects(verifyFrameworkSource(runtime, inventory, "/app"), /source differs.*shared/);
});

test("refuses altered metadata even when the package name and version match", async () => {
  const { runtime, inventory, files } = fixture();
  files.set(
    "/app/node_modules/@asmjs/core/package.json",
    Buffer.from('{"name":"@asmjs/core","version":"unit","main":"elsewhere.js"}'),
  );
  await assert.rejects(verifyFrameworkSource(runtime, inventory, "/app"), /metadata differs/);
});

test("refuses hidden nested framework copies that could override the verified root packages", async () => {
  const { runtime, inventory } = fixture();
  runtime.fs.exists = async (path) => path.endsWith("/core/node_modules/@asmjs");
  await assert.rejects(
    verifyFrameworkSource(runtime, inventory, "/app"),
    /nested framework copies/,
  );
});

test("allows an empty nested scope without mistaking it for another package", async () => {
  const { runtime, inventory } = fixture();
  runtime.fs.exists = async (path) => path.endsWith("/core/node_modules/@asmjs");
  runtime.fs.readdir = async () => [];
  assert.equal((await verifyFrameworkSource(runtime, inventory, "/app")).length, 1);
});
