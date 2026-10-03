// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateRegistry } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

const from = "/p/.assemblejs";
const found = (
  name: string,
  view: string,
  renderer: string,
  over: Partial<DiscoveredAssembly> = {},
): DiscoveredAssembly => ({
  name,
  directory: `/p/src/assemblies/${name}`,
  view: `/p/src/assemblies/${name}/${view}`,
  renderer,
  client: undefined,
  service: undefined,
  styles: [],
  ...over,
});
const generate = (assemblies: readonly DiscoveredAssembly[], script?: string) =>
  generateRegistry(assemblies, { from, script, packages: { react: "@assemblejs/renderer-react" } });

describe("generating the registry the built server imports", () => {
  it("imports every view by name, so the graph is static", () => {
    const source = generate([
      found("cart", "cart.html", "html"),
      found("hi", "hi.react.tsx", "react"),
    ]);
    expect(source).toContain('import view_cart from "../src/assemblies/cart/cart.html";');
    expect(source).toContain('import * as view_hi from "../src/assemblies/hi/hi.react.js";');
    expect(source).not.toContain("readdir");
    expect(source).not.toContain("import(");
  });

  it("wires a framework view to its renderer's server half, and an html view to itself", () => {
    const source = generate([
      found("cart", "cart.html", "html"),
      found("hi", "hi.react.tsx", "react"),
    ]);
    expect(source).toContain(
      'import { renderToMarkup as render_react } from "@assemblejs/renderer-react";',
    );
    expect(source).toContain("markup: (input) => render_react(view_hi.default, input)");
    expect(source).toContain("markup: () => view_cart");
  });

  it("declares an assembly with no browser half static, so it ships no JavaScript", () => {
    const source = generate(
      [found("cart", "cart.html", "html")],
      "/_assemblejs/assets/client-1.js",
    );
    expect(source).toContain('mount: "none"');
    expect(source).not.toContain("assets:");
  });

  it("links the client entry for every assembly that has a browser half", () => {
    const source = generate(
      [
        found("hi", "hi.react.tsx", "react"),
        found("form", "form.html", "html", { client: "/p/src/assemblies/form/form.client.ts" }),
      ],
      "/_assemblejs/assets/client-1.js",
    );
    expect(source.match(/js: \["\/_assemblejs\/assets\/client-1\.js"\]/g)?.length).toBe(2);
    expect(source).not.toContain('mount: "none"');
  });

  it("reads a framework view's own mount, and never an html view's", () => {
    const source = generate([
      found("hi", "hi.react.tsx", "react"),
      found("cart", "cart.html", "html"),
    ]);
    expect(source).toContain("mount: view_hi.mount");
    expect(source).not.toContain("view_cart.mount");
  });

  it("gives two assemblies whose names differ only in a hyphen two imports", () => {
    const source = generate([found("x-1", "x-1.html", "html"), found("x1", "x1.html", "html")]);
    expect(source).toContain("import view_x_1 from");
    expect(source).toContain("import view_x1 from");
  });

  it("runs an assembly's service before it renders", () => {
    const source = generate([
      found("cart", "cart.html", "html", { service: "/p/src/assemblies/cart/cart.service.ts" }),
    ]);
    expect(source).toContain('import service_cart from "../src/assemblies/cart/cart.service.js";');
    expect(source).toContain("services: [service_cart]");
  });

  it("generates a valid empty registry, and always says it is generated", () => {
    const source = generate([]);
    expect(source).toContain("export const assemblies: readonly AssemblyDefinition[] = [\n\n];");
    expect(source).toContain("GENERATED");
  });
});
