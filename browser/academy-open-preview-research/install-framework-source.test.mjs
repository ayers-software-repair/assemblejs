// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, test } from "node:test";
import { FRAMEWORK_PACKAGES } from "./framework-packages.js";
import { installFrameworkSource } from "./install-framework-source.js";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
// Synthetic boundary bytes are never served as framework packages by the hosted preparation.
const fixture = () => {
  const assets = new Map();
  const files = new Map();
  const packages = FRAMEWORK_PACKAGES.map((name, index) => {
    const bytes = new Uint8Array([0, 255, index, 128]);
    const file = `asmjs-${name}-unit.tgz`;
    assets.set(`/vendor/framework/${file}`, bytes);
    return {
      name: `@asmjs/${name}`,
      version: "unit",
      file,
      bytes: bytes.length,
      sha256: digest(bytes),
      metadataSha256: digest("metadata"),
      moduleHashes: { "index.js": digest("module") },
    };
  });
  const inventory = {
    sourceCommit: "a".repeat(40),
    sourceTree: "b".repeat(40),
    packages,
    files: { "package.json": "{}", "src/page.html": "<p>unit</p>" },
  };
  globalThis.fetch = async (url) => {
    if (url === "/framework-source.json") return new Response(JSON.stringify(inventory));
    const bytes = assets.get(url);
    assert.ok(bytes, `unexpected asset URL: ${url}`);
    return new Response(bytes);
  };
  const runtime = {
    fs: {
      writeFile: async (path, bytes) => {
        files.set(path, bytes);
      },
      readFile: async (path) => files.get(path),
    },
  };
  return { runtime, inventory, files, assets };
};

test("delivers every exact binary archive, reads it back and writes canonical scaffold files", async () => {
  const { runtime, inventory, files } = fixture();
  const delivery = await installFrameworkSource(runtime, "/app");
  assert.deepEqual(delivery.inventory, inventory);
  assert.equal(FRAMEWORK_PACKAGES.length, 12);
  for (const entry of inventory.packages) {
    assert.equal(delivery.references[entry.name], `file:/framework-packages/${entry.file}`);
    assert.equal(digest(files.get(`/framework-packages/${entry.file}`)), entry.sha256);
  }
  assert.equal(files.get("/app/src/page.html"), "<p>unit</p>");
  assert.equal(files.size, 14);
});

test("rejects altered downloaded bytes before writing them", async () => {
  const { runtime, inventory, files, assets } = fixture();
  assets.set(`/vendor/framework/${inventory.packages[0].file}`, new Uint8Array([1, 2, 3, 4]));
  await assert.rejects(installFrameworkSource(runtime, "/app"), /package hash differs/);
  assert.equal(files.size, 0);
});

test("rejects a byte-changing filesystem delivery before install", async () => {
  const { runtime, files } = fixture();
  runtime.fs.readFile = async () => new Uint8Array([1, 2, 3]);
  await assert.rejects(installFrameworkSource(runtime, "/app"), /package bytes changed/);
  assert.equal(files.size, 1);
});

for (const [label, alter] of [
  [
    "duplicate packages",
    (data) => {
      data.packages[1] = data.packages[0];
    },
  ],
  [
    "foreign package",
    (data) => {
      data.packages[0].name = "unrelated";
    },
  ],
  [
    "archive traversal",
    (data) => {
      data.packages[0].file = "../outside.tgz";
    },
  ],
  [
    "module traversal",
    (data) => {
      data.packages[0].moduleHashes["../outside.js"] = "a".repeat(64);
    },
  ],
  [
    "missing metadata identity",
    (data) => {
      delete data.packages[0].metadataSha256;
    },
  ],
  [
    "missing entry identity",
    (data) => {
      data.packages[0].moduleHashes = {};
    },
  ],
  [
    "invalid source commit",
    (data) => {
      data.sourceCommit = "not-a-commit";
    },
  ],
])
  test(`rejects ${label} before archive delivery`, async () => {
    const { runtime, inventory, files } = fixture();
    alter(inventory);
    await assert.rejects(installFrameworkSource(runtime, "/app"), /invalid/);
    assert.equal(files.size, 0);
  });

test("does not write a scaffold path outside the supplied project", async () => {
  const { runtime, inventory, files } = fixture();
  inventory.files = { "../outside": "never" };
  await assert.rejects(installFrameworkSource(runtime, "/app"), /scaffold source path/);
  assert.equal(
    [...files.keys()].some((path) => path.includes("..")),
    false,
  );
});
