// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installedManifest } from "@assemblejs/cli";

describe("the manifest of a package a project installs", () => {
  it("is its name, its version and what it depends on", () => {
    const root = mkdtempSync(join(tmpdir(), "installed-"));
    mkdirSync(join(root, "node_modules", "@x", "one"), { recursive: true });
    writeFileSync(
      join(root, "node_modules", "@x", "one", "package.json"),
      JSON.stringify({ name: "@x/one", version: "1.2.3", dependencies: { "@x/two": "1.2.3" } }),
    );
    expect(installedManifest(root, "@x/one")).toEqual({
      name: "@x/one",
      version: "1.2.3",
      dependencies: { "@x/two": "1.2.3" },
    });
  });

  // A workspace keeps its packages at its own root and links them into each project, so an
  // installed package is read through a link out of the project, where a project's own files
  // are not.
  it("is read through the package manager's link, wherever it keeps the package", () => {
    const store = mkdtempSync(join(tmpdir(), "installed-store-"));
    writeFileSync(
      join(store, "package.json"),
      JSON.stringify({ name: "@x/one", version: "2.0.0" }),
    );
    const root = mkdtempSync(join(tmpdir(), "installed-"));
    mkdirSync(join(root, "node_modules", "@x"), { recursive: true });
    symlinkSync(store, join(root, "node_modules", "@x", "one"));
    expect(installedManifest(root, "@x/one").version).toBe("2.0.0");
  });

  it("is nothing known for a package the project does not install", () => {
    expect(installedManifest(mkdtempSync(join(tmpdir(), "installed-")), "@x/none")).toEqual({
      name: undefined,
      version: undefined,
      dependencies: {},
    });
  });
});
