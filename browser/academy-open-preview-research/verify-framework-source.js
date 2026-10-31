// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { boundedOperation } from "../academy-open-runtime-research/bounded-operation.js";
import { sha256 } from "./sha256.js";

/** Confirms installed entry bytes, not only package versions that also exist in the registry. */
export async function verifyFrameworkSource(runtime, inventory, root) {
  const nested = [
    `${root}/node_modules/@asmjs/node_modules/@asmjs`,
    ...inventory.packages.map((entry) => `${root}/node_modules/${entry.name}/node_modules/@asmjs`),
  ];
  for (const path of nested)
    if (
      (await boundedOperation(runtime.fs.exists(path), "nested source lookup")) &&
      (await boundedOperation(runtime.fs.readdir(path), "nested source inventory")).length > 0
    )
      throw new Error("installed project has nested framework copies outside the verified roots");
  const verified = [];
  for (const entry of inventory.packages) {
    const path = `${root}/node_modules/${entry.name}`;
    const metadataBytes = await boundedOperation(
      runtime.fs.readFile(`${path}/package.json`),
      `metadata ${entry.name}`,
    );
    if ((await sha256(metadataBytes)) !== entry.metadataSha256)
      throw new Error(`installed metadata differs: ${entry.name}`);
    const metadata = JSON.parse(new TextDecoder().decode(metadataBytes));
    const files = {};
    for (const [file, expected] of Object.entries(entry.moduleHashes)) {
      const bytes = await boundedOperation(
        runtime.fs.readFile(`${path}/dist/${file}`),
        `module ${entry.name}/${file}`,
      );
      const actual = await sha256(bytes);
      if (actual !== expected) throw new Error(`installed source differs: ${entry.name}/${file}`);
      files[file] = actual;
    }
    if (metadata.name !== entry.name || metadata.version !== entry.version)
      throw new Error(`installed package differs: ${entry.name}`);
    verified.push({ name: metadata.name, version: metadata.version, files });
  }
  return verified;
}
