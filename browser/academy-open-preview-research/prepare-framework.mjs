// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { pack } from "../../conformance/harness/pack.mjs";
import { FRAMEWORK_PACKAGES } from "./framework-packages.js";
import { moduleHashes } from "./module-hashes.mjs";

const workspace = fileURLToPath(new URL("../../", import.meta.url));
const into = resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("a temporary package destination is required");
await mkdir(into, { recursive: true });
execFileSync("git", ["diff", "--quiet", "HEAD", "--"], { cwd: workspace });
const names = FRAMEWORK_PACKAGES;
const packed = pack(names, into);
const packages = [];
for (const name of names) {
  const directory = resolve(workspace, "packages", name);
  const metadata = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
  const file = packed(name);
  if (dirname(file) !== into) throw new Error("package delivery escaped its destination");
  const bytes = await readFile(file);
  const modules = await moduleHashes(resolve(directory, "dist"));
  const packedMetadata = execFileSync("tar", ["-xOf", file, "package/package.json"]);
  packages.push({
    name: metadata.name,
    version: metadata.version,
    file: basename(file),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    moduleHashes: modules,
    metadataSha256: createHash("sha256").update(packedMetadata).digest("hex"),
  });
}
execFileSync("git", ["diff", "--quiet", "HEAD", "--"], { cwd: workspace });
const { projectFiles } = await import(
  pathToFileURL(resolve(workspace, "packages/cli/dist/index.js")).href
);
const files = projectFiles("academy-workspace");
const sourceCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: workspace,
  encoding: "utf8",
}).trim();
const sourceTree = execFileSync("git", ["rev-parse", "HEAD^{tree}"], {
  cwd: workspace,
  encoding: "utf8",
}).trim();
await writeFile(
  resolve(into, "framework-source.json"),
  JSON.stringify({ sourceCommit, sourceTree, packages, files }),
);
