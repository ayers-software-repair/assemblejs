// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { ownManifest } from "@assemblejs/build";

const made: string[] = [];
afterAll(() => {
  for (const dir of made) rmSync(dir, { recursive: true, force: true });
});
const packageOf = (manifest: string): string => {
  const dir = mkdtempSync(join(tmpdir(), "manifest-"));
  made.push(dir);
  writeFileSync(join(dir, "package.json"), manifest);
  return pathToFileURL(join(dir, "dist", "index.js")).href;
};

describe("the manifest of the package a module belongs to", () => {
  it("is this package's, from the source tree: its version and its development dependencies", () => {
    const own = ownManifest(import.meta.url);
    expect(own.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(own.devDependencies["typescript"]).toMatch(/^\d+\.\d+\.\d+$/);
    expect(own.devDependencies["@types/node"]).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("reads only the pins written as strings, and none where a package has no development dependencies", () => {
    expect(
      ownManifest(packageOf('{"version":"1.2.3","devDependencies":{"a":"1.0.0","b":2}}')),
    ).toEqual({ version: "1.2.3", devDependencies: { a: "1.0.0" } });
    expect(ownManifest(packageOf('{"version":"1.2.3"}'))).toEqual({
      version: "1.2.3",
      devDependencies: {},
    });
  });

  it("refuses a manifest with no version, and a module no package owns", () => {
    expect(() => ownManifest(packageOf('{"name":"x"}'))).toThrow(/has no version/);
    expect(() => ownManifest(pathToFileURL("/no-such-package/module.js").href)).toThrow(
      /no package\.json above/,
    );
  });
});
