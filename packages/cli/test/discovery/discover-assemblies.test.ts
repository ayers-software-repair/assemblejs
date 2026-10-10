// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { discoverAssemblies } from "@assemblejs/cli";

let project = "";
let root = "";
const assembly = (name: string, files: readonly string[]): void => {
  mkdirSync(join(root, name), { recursive: true });
  for (const file of files) writeFileSync(join(root, name, file), "");
};

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), "assemblejs-"));
  root = join(project, "src", "assemblies");
  mkdirSync(root, { recursive: true });
});
afterEach(() => {
  rmSync(project, { recursive: true, force: true });
});

describe("discovering assemblies", () => {
  it("treats a directory as an assembly, with nothing to register", () => {
    assembly("cart", ["cart.svelte"]);
    assembly("hello-react", ["hello-react.react.tsx", "hello-react.css"]);
    const { assemblies, problems } = discoverAssemblies(project);
    expect(problems).toEqual([]);
    expect(assemblies.map((a) => [a.name, a.renderer])).toEqual([
      ["cart", "svelte"],
      ["hello-react", "react"],
    ]);
  });

  it("finds the optional siblings without being told about them", () => {
    assembly("cart", ["cart.svelte", "cart.client.ts", "cart.css", "extra.css"]);
    const [found] = discoverAssemblies(project).assemblies;
    expect(found?.client).toMatch(/cart\.client\.ts$/);
    expect(found?.styles).toHaveLength(2);
    expect(found?.service).toBeUndefined();
  });

  it("finds the assembly's service by its name, and only that one", () => {
    assembly("cart", ["cart.svelte", "cart.service.ts", "other.service.ts"]);
    const [found] = discoverAssemblies(project).assemblies;
    expect(found?.service).toMatch(/cart\/cart\.service\.ts$/);
    assembly("shop", ["shop.svelte", "other.service.ts"]);
    expect(discoverAssemblies(project).assemblies[1]?.service).toBeUndefined();
  });

  it("has no client when the assembly declares none", () => {
    assembly("cart", ["cart.html"]);
    expect(discoverAssemblies(project).assemblies[0]?.client).toBeUndefined();
  });

  // Skipping is how an author renames a file, loses their assembly, and hears about it from a
  // visitor. Every one of these is reported instead.
  it("reports a directory with no view rather than skipping it", () => {
    assembly("cart", ["cart.css", "notes.txt"]);
    const { assemblies, problems } = discoverAssemblies(project);
    expect(assemblies).toEqual([]);
    expect(problems[0]).toMatchObject({
      rule: "directory-is-an-assembly",
      message: expect.stringMatching(/has no view file/),
      fix: expect.stringMatching(/add cart\.html/),
    });
  });

  it("reports a directory with more than one view", () => {
    assembly("cart", ["cart.svelte", "cart.vue"]);
    expect(discoverAssemblies(project).problems[0]).toMatchObject({
      rule: "one-framework-per-assembly",
      message: expect.stringMatching(/more than one view file/),
    });
  });

  it("reads files of the view's framework beside it as its own components, not views", () => {
    assembly("cart", ["cart.lit.ts", "price.lit.ts", "cart.client.ts"]);
    const { assemblies, problems } = discoverAssemblies(project);
    expect(problems).toEqual([]);
    expect(assemblies[0]?.view).toBe(`${root}/cart/cart.lit.ts`);
    expect(assemblies[0]?.renderer).toBe("lit");
  });

  it("reports a directory whose name could never be an assembly", () => {
    assembly("Cart", ["cart.html"]);
    assembly("cart name", ["cart.html"]);
    const { problems } = discoverAssemblies(project);
    expect(problems).toHaveLength(2);
    // Each refusal names the name that would work.
    expect(problems.map((problem) => problem.fix).sort()).toEqual([
      'rename the directory to "cart"',
      'rename the directory to "cart-name"',
    ]);
  });

  it("reports an ambiguous view that does not say which framework wrote it", () => {
    assembly("cart", ["cart.tsx"]);
    expect(discoverAssemblies(project).problems[0]).toMatchObject({
      rule: "the-file-name-says-the-framework",
      fix: expect.stringMatching(/cart\.react\.tsx/),
    });
  });

  it("is an empty project, not a broken one, when there is no assemblies directory", () => {
    expect(discoverAssemblies(join(project, "nowhere"))).toEqual({ assemblies: [], problems: [] });
  });

  it("does not mistake a client file for a view", () => {
    assembly("cart", ["cart.html", "cart.client.ts"]);
    const { assemblies, problems } = discoverAssemblies(project);
    expect(problems).toEqual([]);
    expect(assemblies[0]?.view).toMatch(/cart\.html$/);
  });

  it("passes over a dangling link in the tree, rather than crashing the build or dev", () => {
    assembly("cart", ["cart.html"]);
    symlinkSync(join(root, "nowhere"), join(root, "dangling"));
    expect(discoverAssemblies(project).assemblies.map((found) => found.name)).toEqual(["cart"]);
  });

  // Nothing outside the project is looked at: a directory that leads out is not listed, whatever
  // stands where it leads, and a file that leads out is kept by its name for a reader to refuse.
  it("does not list an assembly whose directory leads out of the project, and says so", () => {
    const outside = mkdtempSync(join(tmpdir(), "assemblejs-outside-"));
    writeFileSync(join(outside, "stolen.html"), "");
    writeFileSync(join(outside, "notes.md"), "");
    assembly("cart", ["cart.html"]);
    symlinkSync(outside, join(root, "stolen"));
    const { assemblies, problems } = discoverAssemblies(project);
    expect(assemblies.map((found) => found.name)).toEqual(["cart"]);
    expect(problems).toMatchObject([
      { path: `${root}/stolen`, rule: "a-project-stays-inside-its-root" },
    ]);
    expect(JSON.stringify(problems)).not.toContain("notes.md");
  });

  it("keeps a file that leads out by its name, and reports it where the project names it", () => {
    const outside = mkdtempSync(join(tmpdir(), "assemblejs-outside-"));
    for (const file of ["view.html", "sheet.css", "half.ts"])
      writeFileSync(join(outside, file), "");
    assembly("cart", ["cart.service.ts"]);
    symlinkSync(join(outside, "view.html"), join(root, "cart", "cart.html"));
    symlinkSync(join(outside, "sheet.css"), join(root, "cart", "cart.css"));
    symlinkSync(join(outside, "half.ts"), join(root, "cart", "cart.client.ts"));
    const { assemblies, problems } = discoverAssemblies(project);
    expect(assemblies.map((found) => found.view)).toEqual([`${root}/cart/cart.html`]);
    expect(problems.map((problem) => [problem.path, problem.rule])).toEqual([
      [`${root}/cart/cart.html`, "a-project-stays-inside-its-root"],
      [`${root}/cart/cart.client.ts`, "a-project-stays-inside-its-root"],
      [`${root}/cart/cart.css`, "a-project-stays-inside-its-root"],
    ]);
  });

  it("lists nothing, and says why, where the assemblies themselves lead out", () => {
    const outside = mkdtempSync(join(tmpdir(), "assemblejs-outside-"));
    mkdirSync(join(outside, "stolen"));
    writeFileSync(join(outside, "stolen", "stolen.html"), "");
    rmSync(root, { recursive: true });
    symlinkSync(outside, root);
    expect(discoverAssemblies(project)).toMatchObject({
      assemblies: [],
      problems: [{ path: root, rule: "a-project-stays-inside-its-root" }],
    });
  });

  it("lists an assembly whose directory is a link that stays inside the project", () => {
    mkdirSync(join(project, "shared", "cart"), { recursive: true });
    writeFileSync(join(project, "shared", "cart", "cart.html"), "");
    symlinkSync(join(project, "shared", "cart"), join(root, "cart"));
    expect(discoverAssemblies(project)).toMatchObject({
      assemblies: [{ name: "cart" }],
      problems: [],
    });
  });
});
