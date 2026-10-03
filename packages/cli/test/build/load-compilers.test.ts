// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadCompilers } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

const assembly = (renderer: string): DiscoveredAssembly => ({
  name: renderer,
  directory: `/p/${renderer}`,
  view: `/p/${renderer}/${renderer}.x`,
  renderer,
  client: undefined,
  service: undefined,
  styles: [],
});

describe("loading the compilers a project's views need", () => {
  it("loads each one used, and only those", async () => {
    const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
    const both = await loadCompilers(example, [
      assembly("svelte"),
      assembly("vue"),
      assembly("solid"),
    ]);
    expect(Object.keys(both.compilers).sort()).toEqual(["solid", "svelte", "vue"]);
    expect(both.problems).toEqual([]);
    expect((await loadCompilers(example, [assembly("react")])).compilers).toEqual({});
  });

  it("reports a framework whose compiler cannot be loaded", async () => {
    const root = mkdtempSync(join(tmpdir(), "no-compiler-"));
    writeFileSync(join(root, "package.json"), "{}");
    const { problems } = await loadCompilers(root, [assembly("vue")]);
    expect(problems).toEqual([
      expect.objectContaining({ fix: "reinstall vue", rule: "a-view-needs-its-renderer" }),
    ]);
  });
});
