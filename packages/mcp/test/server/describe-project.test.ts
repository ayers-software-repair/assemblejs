// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { describeProject, resolveRoot } from "@assemblejs/mcp";
import type { ProjectRoot } from "@assemblejs/mcp";

let root: ProjectRoot;
let dir = "";

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-project-"));
  mkdirSync(join(dir, "src", "assemblies"), { recursive: true });
  root = resolveRoot(dir);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const assembly = (name: string, file: string): void => {
  const at = join(dir, "src", "assemblies", name);
  mkdirSync(at, { recursive: true });
  writeFileSync(join(at, file), "");
};

describe("the project's whole shape", () => {
  it("is one read, so an agent does not spend turns asking what exists", () => {
    assembly("cart", "cart.svelte");
    assembly("counter", "counter.react.tsx");
    const project = describeProject(root);
    expect(project.assemblies.map((a) => a.name)).toEqual(["cart", "counter"]);
    expect(project.renderers).toEqual(["react", "svelte"]);
    expect(project.root).toBe(dir);
  });

  it("says which assemblies have a browser half", () => {
    mkdirSync(join(dir, "src", "assemblies", "cart"), { recursive: true });
    writeFileSync(join(dir, "src", "assemblies", "cart", "cart.html"), "");
    writeFileSync(join(dir, "src", "assemblies", "cart", "cart.client.ts"), "");
    expect(describeProject(root).assemblies[0]?.hasClient).toBe(true);
  });

  it("carries the problems rather than hiding them behind an empty list", () => {
    mkdirSync(join(dir, "src", "assemblies", "Broken"), { recursive: true });
    expect(describeProject(root).problems.join()).toContain("Broken");
  });

  it("is an empty project, not a broken one, when nothing has been written yet", () => {
    const project = describeProject(root);
    expect(project.assemblies).toEqual([]);
    expect(project.problems).toEqual([]);
  });
});
