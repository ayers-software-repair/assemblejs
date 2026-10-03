// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildProblems } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const assembly = (renderer: string, client?: string): DiscoveredAssembly => ({
  name: "a",
  directory: "src/assemblies/a",
  view: "src/assemblies/a/a.x",
  renderer,
  client,
  service: undefined,
  styles: [],
});

describe("what would stop a build, found before the bundler runs", () => {
  it("passes html, and a framework whose renderer the project installed", () => {
    expect(
      buildProblems(example, [assembly("html"), assembly("react"), assembly("svelte")]),
    ).toEqual([]);
  });

  it("names the package a project is missing", () => {
    const root = mkdtempSync(join(tmpdir(), "bare-"));
    writeFileSync(join(root, "package.json"), "{}");
    expect(buildProblems(root, [assembly("react")])[0]).toMatchObject({
      rule: "a-view-needs-its-renderer",
      fix: "install @assemblejs/renderer-react",
    });
  });

  it("refuses a renderer this version cannot build, and a framework view with a .client.ts", () => {
    expect(buildProblems(example, [assembly("angular")])[0]?.message).toMatch(/cannot build yet/);
    expect(buildProblems(example, [assembly("react", "a.client.ts")])[0]).toMatchObject({
      rule: "one-framework-per-assembly",
      message: expect.stringMatching(/is its component/),
    });
  });
});
