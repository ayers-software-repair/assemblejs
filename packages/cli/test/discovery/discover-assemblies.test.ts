// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { discoverAssemblies } from "@assemblejs/cli";

let root = "";
const assembly = (name: string, files: readonly string[]): void => {
  mkdirSync(join(root, name), { recursive: true });
  for (const file of files) writeFileSync(join(root, name, file), "");
};

beforeEach(() => {
  root = join(mkdtempSync(join(tmpdir(), "assemblejs-")), "assemblies");
  mkdirSync(root, { recursive: true });
});
afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("discovering assemblies", () => {
  it("treats a directory as an assembly, with nothing to register", () => {
    assembly("cart", ["cart.svelte"]);
    assembly("hello-react", ["hello-react.react.tsx", "hello-react.css"]);
    const { assemblies, problems } = discoverAssemblies(root);
    expect(problems).toEqual([]);
    expect(assemblies.map((a) => [a.name, a.renderer])).toEqual([
      ["cart", "svelte"],
      ["hello-react", "react"],
    ]);
  });

  it("finds the optional siblings without being told about them", () => {
    assembly("cart", ["cart.svelte", "cart.client.ts", "cart.css", "extra.css"]);
    const [found] = discoverAssemblies(root).assemblies;
    expect(found?.client).toMatch(/cart\.client\.ts$/);
    expect(found?.styles).toHaveLength(2);
  });

  it("has no client when the assembly declares none", () => {
    assembly("cart", ["cart.html"]);
    expect(discoverAssemblies(root).assemblies[0]?.client).toBeUndefined();
  });

  // Skipping is how an author renames a file, loses their assembly, and hears about it from a
  // visitor. Every one of these is reported instead.
  it("reports a directory with no view rather than skipping it", () => {
    assembly("cart", ["cart.css", "notes.txt"]);
    const { assemblies, problems } = discoverAssemblies(root);
    expect(assemblies).toEqual([]);
    expect(problems.join()).toMatch(/has no view file/);
  });

  it("reports a directory with more than one view", () => {
    assembly("cart", ["cart.svelte", "cart.vue"]);
    expect(discoverAssemblies(root).problems.join()).toMatch(/more than one view file/);
  });

  it("reports a directory whose name could never be an assembly", () => {
    assembly("Cart", ["cart.html"]);
    assembly("cart name", ["cart.html"]);
    expect(discoverAssemblies(root).problems).toHaveLength(2);
  });

  it("reports an ambiguous view that does not say which framework wrote it", () => {
    assembly("cart", ["cart.tsx"]);
    expect(discoverAssemblies(root).problems.join()).toMatch(/has no view file/);
  });

  it("is an empty project, not a broken one, when there is no assemblies directory", () => {
    expect(discoverAssemblies(join(root, "nowhere"))).toEqual({ assemblies: [], problems: [] });
  });

  it("does not mistake a client file for a view", () => {
    assembly("cart", ["cart.html", "cart.client.ts"]);
    const { assemblies, problems } = discoverAssemblies(root);
    expect(problems).toEqual([]);
    expect(assemblies[0]?.view).toMatch(/cart\.html$/);
  });
});
