// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { boundedOperation } from "../academy-open-runtime-research/bounded-operation.js";
import { sha256 } from "./sha256.js";
import { FRAMEWORK_PACKAGES } from "./framework-packages.js";

const names = FRAMEWORK_PACKAGES.map((name) => `@asmjs/${name}`);

/** Loads exact current-source tarballs; no AssembleJS package is bootstrapped from the registry. */
export async function installFrameworkSource(runtime, root) {
  const response = await boundedOperation(fetch("/framework-source.json"), "source inventory");
  if (!response.ok) throw new Error("current framework source inventory unavailable");
  const inventory = await boundedOperation(response.json(), "source inventory JSON");
  if (
    typeof inventory !== "object" ||
    inventory === null ||
    !/^[a-f0-9]{40}$/.test(inventory.sourceCommit) ||
    !/^[a-f0-9]{40}$/.test(inventory.sourceTree) ||
    !Array.isArray(inventory.packages) ||
    inventory.packages.length !== names.length ||
    new Set(inventory.packages.map((entry) => entry.name)).size !== names.length ||
    !inventory.files ||
    typeof inventory.files !== "object"
  )
    throw new Error("invalid current-source inventory");
  const references = {};
  for (const entry of inventory.packages) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !names.includes(entry.name) ||
      !/^[a-zA-Z0-9.-]+\.tgz$/.test(entry.file) ||
      !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      !/^[a-f0-9]{64}$/.test(entry.metadataSha256) ||
      !entry.moduleHashes ||
      typeof entry.moduleHashes !== "object" ||
      !Object.hasOwn(entry.moduleHashes, "index.js") ||
      !Object.entries(entry.moduleHashes).every(
        ([path, hash]) =>
          /^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.js$/.test(path) && /^[a-f0-9]{64}$/.test(hash),
      ) ||
      !Number.isSafeInteger(entry.bytes) ||
      entry.bytes <= 0 ||
      typeof entry.version !== "string"
    )
      throw new Error("invalid source package entry");
    const response = await boundedOperation(
      fetch(`/vendor/framework/${entry.file}`),
      `fetch ${entry.name}`,
    );
    if (!response.ok) throw new Error(`source package unavailable: ${entry.name}`);
    const bytes = new Uint8Array(
      await boundedOperation(response.arrayBuffer(), `download ${entry.name}`),
    );
    if (bytes.length !== entry.bytes || (await sha256(bytes)) !== entry.sha256)
      throw new Error(`source package hash differs: ${entry.name}`);
    const path = `/framework-packages/${entry.file}`;
    await boundedOperation(runtime.fs.writeFile(path, bytes), `deliver ${entry.name}`);
    const stored = await boundedOperation(runtime.fs.readFile(path), `read back ${entry.name}`);
    if ((await sha256(stored)) !== entry.sha256)
      throw new Error(`source package bytes changed: ${entry.name}`);
    references[entry.name] = `file:${path}`;
  }
  for (const [path, text] of Object.entries(inventory.files)) {
    if (
      typeof text !== "string" ||
      path.startsWith("/") ||
      path.includes("\\") ||
      path.split("/").some((part) => part === "." || part === ".." || part === "")
    )
      throw new Error("invalid scaffold source path");
    await boundedOperation(runtime.fs.writeFile(`${root}/${path}`, text), `scaffold ${path}`);
  }
  return { inventory, references };
}
