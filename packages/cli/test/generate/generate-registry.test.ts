// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateRegistry } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

const found = (name: string, view: string): DiscoveredAssembly => ({
  name,
  directory: `src/assemblies/${name}`,
  view: `src/assemblies/${name}/${view}`,
  renderer: "html",
  client: undefined,
  styles: [],
});

describe("generating the registry", () => {
  it("imports every assembly by name, so the graph is static", () => {
    const source = generateRegistry([
      found("cart", "cart.html"),
      found("hello-react", "hello-react.react.tsx"),
    ]);
    // Static imports, not a directory scan: production never globs at run time.
    expect(source).toContain(`import assembly_cart from "../src/assemblies/cart/cart.html";`);
    expect(source).toContain(
      `import assembly_helloReact from "../src/assemblies/hello-react/hello-react.react.js";`,
    );
    expect(source).not.toContain("readdir");
    expect(source).not.toContain("import(");
  });

  it("rewrites a typescript view to the specifier node will resolve", () => {
    const source = generateRegistry([found("cart", "cart.react.tsx")]);
    expect(source).toContain(".react.js");
    expect(source).not.toContain(".tsx");
  });

  it("names each assembly with the name its directory has", () => {
    const source = generateRegistry([found("cart", "cart.html")]);
    expect(source).toContain(`{ name: "cart", views: { default: assembly_cart } }`);
  });

  it("generates a valid empty registry for a project with no assemblies", () => {
    const source = generateRegistry([]);
    expect(source).toContain("export const assemblies: readonly AssemblyDefinition[] = [];");
  });

  it("always says it is generated", () => {
    expect(generateRegistry([])).toContain("GENERATED");
    expect(generateRegistry([found("cart", "cart.html")])).toContain("GENERATED");
  });
});
