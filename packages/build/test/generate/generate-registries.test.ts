// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateRegistries } from "@asmjs/build";
import type { DiscoveredAssembly } from "@asmjs/build";

const from = "/p/.assemblejs";
const found = (name: string, view: string, renderer: string): DiscoveredAssembly => ({
  name,
  directory: `/p/src/assemblies/${name}`,
  view: `/p/src/assemblies/${name}/${view}`,
  renderer,
  client: undefined,
  service: undefined,
  styles: [],
});
const generate = (assemblies: readonly DiscoveredAssembly[]) =>
  generateRegistries(assemblies, { from, script: "/c.js", packages: {} });

describe("the registry, as the modules it is written in", () => {
  it("is one module for a project with no JSX, exporting the list the server reads", () => {
    const modules = generate([found("hello", "hello.html", "html")]);
    expect(Object.keys(modules)).toEqual(["assemblies.ts"]);
    expect(modules["assemblies.ts"]).toContain('name: "hello"');
    expect(modules["assemblies.ts"]).toContain(
      "export const assemblies: readonly AssemblyDefinition[] = [",
    );
    expect(modules["assemblies.ts"]).not.toContain("...");
  });

  // The first experiment of the written setup: in an editor, a module importing a React view
  // and a Solid view showed an error against whichever project it was not in.
  it("gives each owner of JSX a module of its own, which the one the server reads spreads in", () => {
    const modules = generate([
      found("shop", "shop.react.tsx", "react"),
      found("search", "search.solid.tsx", "solid"),
      found("cart", "cart.preact.tsx", "preact"),
      found("meter", "meter.lit.ts", "lit"),
    ]);
    expect(Object.keys(modules)).toEqual([
      "assemblies.preact.ts",
      "assemblies.react.ts",
      "assemblies.solid.ts",
      "assemblies.ts",
    ]);
    expect(modules["assemblies.react.ts"]).toContain(
      "export const assemblies_react: readonly AssemblyDefinition[] = [",
    );
    expect(modules["assemblies.react.ts"]).toContain('name: "shop"');
    expect(modules["assemblies.react.ts"]).not.toContain("search");
    expect(modules["assemblies.solid.ts"]).toContain("render_solid(view_search.default, input)");
    const own = modules["assemblies.ts"] ?? "";
    expect(own).toContain('import { assemblies_preact } from "./assemblies.preact.js";');
    expect(own).toContain('import { assemblies_react } from "./assemblies.react.js";');
    expect(own).toContain('import { assemblies_solid } from "./assemblies.solid.js";');
    expect(own).toContain('name: "meter"');
    expect(own).toMatch(
      /\n {2}\.\.\.assemblies_preact,\n {2}\.\.\.assemblies_react,\n {2}\.\.\.assemblies_solid,\n\];/,
    );
    // No owner's view is imported by the module the server reads.
    expect(own).not.toContain("src/assemblies/shop");
    expect(own).not.toContain("renderer-react");
  });
});
