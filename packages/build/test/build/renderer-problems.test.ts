// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { rendererProblems } from "@assemblejs/build";

/** A project with the named packages installed, as far as a build looks to find them. */
const project = (...installed: readonly string[]): string => {
  const root = mkdtempSync(join(tmpdir(), "renderer-problems-"));
  for (const name of installed) {
    mkdirSync(join(root, "node_modules", name), { recursive: true });
    writeFileSync(join(root, "node_modules", name, "package.json"), "{}");
  }
  return root;
};
const said = (root: string, renderer: string): string[] =>
  rendererProblems(root, "cart", renderer, join(root, "src/assemblies/cart/cart.x")).map(
    ({ path, message, fix }) => `${path.slice(root.length + 1)} | ${message} | ${fix}`,
  );

describe("what stops a view being built for want of its renderer", () => {
  it("is nothing for plain html, or for a renderer the project has installed", () => {
    expect(said(project(), "html")).toEqual([]);
    expect(said(project("@assemblejs/renderer-react"), "react")).toEqual([]);
    expect(said(project("@assemblejs/renderer-svelte", "svelte"), "svelte")).toEqual([]);
    expect(said(project("@assemblejs/renderer-templates"), "pug")).toEqual([]);
  });

  it("is the renderer's package, at the view, where the project has not installed it", () => {
    expect(said(project(), "react")).toEqual([
      'src/assemblies/cart/cart.x | "cart" is a react assembly and @assemblejs/renderer-react is not installed | install @assemblejs/renderer-react',
    ]);
    expect(said(project(), "ejs")).toEqual([
      'src/assemblies/cart/cart.x | "cart" is an ejs assembly and @assemblejs/renderer-templates is not installed | install @assemblejs/renderer-templates',
    ]);
  });

  // Svelte and Vue views are compiled by the compiler the project installed.
  it("is the framework too, at the manifest, where the build compiles with the project's own", () => {
    expect(said(project(), "vue")).toEqual([
      "package.json | this project has Vue assemblies and vue is not installed | install vue",
      'src/assemblies/cart/cart.x | "cart" is a vue assembly and @assemblejs/renderer-vue is not installed | install @assemblejs/renderer-vue',
    ]);
    expect(said(project("@assemblejs/renderer-svelte"), "svelte")).toEqual([
      "package.json | this project has Svelte assemblies and svelte is not installed | install svelte",
    ]);
    expect(said(project("vue"), "vue")).toHaveLength(1);
  });

  it("is a renderer this version cannot build, with the ones it can", () => {
    const [only, ...rest] = said(project(), "angular");
    expect(rest).toEqual([]);
    expect(only).toMatch(/"cart" is an angular assembly, which this version cannot build yet/);
    expect(only).toMatch(/write it for one of: html, lit, preact, react, solid, svelte, vue, /);
  });
});
