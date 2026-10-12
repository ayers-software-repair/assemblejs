// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateRegistry } from "@assemblejs/build";
import type { AssemblyStyles, DiscoveredAssembly } from "@assemblejs/build";

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
const generate = (
  assemblies: readonly DiscoveredAssembly[],
  script?: string,
  styles?: ReadonlyMap<string, AssemblyStyles>,
) =>
  generateRegistry(assemblies, {
    from,
    script,
    ...(styles === undefined ? {} : { styles }),
    packages: { react: "@assemblejs/renderer-react" },
  });

describe("generating the registry the built server imports", () => {
  it("writes what each view is known to place beside it, and nothing for a view nobody read", () => {
    const source = generateRegistry(
      [found("shell", "shell.html", "html"), found("card", "card.pug", "pug")],
      {
        from,
        script: undefined,
        packages: {},
        placements: new Map([["shell", [{ name: "cart", view: "default" }, { name: "price" }]]]),
      },
    );
    expect(source).toContain(
      'markup: () => view_shell, placements: [{"name":"cart","view":"default"},{"name":"price"}] }',
    );
    expect(source.match(/placements:/g)).toHaveLength(1);
  });

  it("imports every view by name, so the graph is static", () => {
    const source = generate([
      found("cart", "cart.html", "html"),
      found("hi", "hi.react.tsx", "react"),
    ]);
    expect(source).toContain(
      '// @ts-ignore: not TypeScript, and read by the build\nimport view_cart from "../src/assemblies/cart/cart.html";',
    );
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
    expect(source).toContain("mount: said(view_hi).mount");
    expect(source).toContain("shadow: said(view_hi).shadow");
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

  it("links an assembly's stylesheet, a static one's included", () => {
    const source = generate(
      [found("cart", "cart.html", "html")],
      undefined,
      new Map([
        ["cart", { scoped: "/_assemblejs/assets/styles/cart-1a2b3c4d.css", shadow: undefined }],
      ]),
    );
    expect(source).toContain(
      'assets: { css: ["/_assemblejs/assets/styles/cart-1a2b3c4d.css"], js: [] }',
    );
    expect(source).toContain('mount: "none"');
  });

  it("links a framework view's shadow sheet when the view opts into its own shadow root", () => {
    const source = generate(
      [found("hi", "hi.react.tsx", "react")],
      undefined,
      new Map([["hi", { scoped: "/s/hi-1.css", shadow: "/s/hi-1.shadow.css" }]]),
    );
    expect(source).toContain(
      'css: [said(view_hi).shadow === true ? "/s/hi-1.shadow.css" : "/s/hi-1.css"]',
    );
  });

  it("renders a template view's source by its engine, through the one templates package", () => {
    const source = generate([
      found("notes", "notes.md", "markdown"),
      found("cart", "cart.njk", "nunjucks", { client: "/p/src/assemblies/cart/cart.client.ts" }),
    ]);
    expect(source).toContain('import view_notes from "../src/assemblies/notes/notes.md";');
    expect(
      source.match(
        /import \{ renderTemplate as render_template \} from "@assemblejs\/renderer-templates";/g,
      )?.length,
    ).toBe(1);
    // A template's errors name its file, by its path from the project root.
    expect(source).toContain(
      'markup: (input) => render_template("markdown", view_notes, input, "src/assemblies/notes/notes.md")',
    );
    expect(source).toContain(
      'markup: (input) => render_template("nunjucks", view_cart, input, "src/assemblies/cart/cart.njk")',
    );
    // No browser half of its own: none without a .client.ts, the client entry with one.
    expect(source).toMatch(/name: "notes".*mount: "none"/);
    expect(source).not.toMatch(/name: "cart".*mount:/);
    expect(source).not.toContain("view_cart.shadow");
    expect(source).not.toContain("renderToMarkup");
  });

  // A project that type-checks was failed by this module: it read `mount` and `shadow` off
  // every framework view, most of which export neither, and imported files the compiler has
  // no declaration for.
  it("reads what a view says of itself through one typed reader, written once where one is read", () => {
    const framework = generate(
      [found("hi", "hi.react.tsx", "react"), found("yo", "yo.react.tsx", "react")],
      "/c.js",
    );
    expect(framework.match(/^const said = /gm)).toHaveLength(1);
    expect(framework).toContain('readonly mount?: AssemblyDefinition["mount"];');
    expect(framework).toContain('readonly shadow?: AssemblyDefinition["shadow"];');
    expect(framework).not.toMatch(/view_\w+\.(mount|shadow)/);
    // A project of plain views reads nothing of the kind, and is not written the reader.
    expect(generate([found("cart", "cart.html", "html")])).not.toContain("said");
  });

  it("has the compiler pass over the import of a view that is not TypeScript, and no other", () => {
    const source = generate([
      found("board", "board.svelte", "svelte"),
      found("panel", "panel.vue", "vue"),
      found("hi", "hi.react.tsx", "react", { service: "/p/src/assemblies/hi/hi.service.ts" }),
      found("meter", "meter.lit.ts", "lit"),
    ]);
    const ignored = [...source.matchAll(/\/\/ @ts-ignore[^\n]*\nimport ([^\n]+)/g)].map(
      (found) => found[1],
    );
    expect(ignored).toEqual([
      '* as view_board from "../src/assemblies/board/board.svelte";',
      '* as view_panel from "../src/assemblies/panel/panel.vue";',
    ]);
  });
});
