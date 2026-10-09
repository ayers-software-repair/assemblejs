// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { ownVersion } from "@assemblejs/cli";

const versionIn = (manifest: URL): string =>
  (JSON.parse(readFileSync(manifest, "utf8")) as { version: string }).version;

const cli = versionIn(new URL("../../package.json", import.meta.url));
// The workspace root is the one package here whose version differs from every published one,
// so a module under it proves the walk starts from the caller and not from this package.
const root = versionIn(new URL("../../../../package.json", import.meta.url));

describe("the version of the package a module belongs to", () => {
  it("is the one in that package's package.json, from the source tree", () => {
    expect(ownVersion(import.meta.url)).toBe(cli);
  });

  it("answers for whichever package the module lives in, not the package that defines it", () => {
    const underRoot = new URL("../../../../scripts/build-when-stale.mjs", import.meta.url);
    expect(root).not.toBe(cli);
    expect(ownVersion(underRoot.href)).toBe(root);
  });

  it("refuses a module no package owns", () => {
    expect(() => ownVersion(pathToFileURL("/no-such-package/module.js").href)).toThrow(
      /no package\.json above/,
    );
  });

  // The build flattens src/<dir>/ into dist/, so a fixed relative path to package.json would be
  // right in one layout and wrong in the other; the walk is the same in both.
  it("is the same from the built package, in the manifest a new project is given", () => {
    const dist = fileURLToPath(new URL("../../dist/index.js", import.meta.url));
    const script = `import { ownVersion, projectFiles } from ${JSON.stringify(dist)};
const manifest = JSON.parse(projectFiles("probe")["package.json"]);
console.log(JSON.stringify({
  own: ownVersion(${JSON.stringify(pathToFileURL(dist).href)}),
  core: manifest.dependencies["@assemblejs/core"],
  cli: manifest.devDependencies["@assemblejs/cli"],
}));`;
    const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      encoding: "utf8",
    });
    expect(JSON.parse(out)).toEqual({ own: cli, core: `^${cli}`, cli: `^${cli}` });
  });
});
