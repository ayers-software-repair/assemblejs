// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateClientModule } from "@asmjs/build";
import type { DiscoveredAssembly } from "@asmjs/build";

const assembly = (over: Partial<DiscoveredAssembly>): DiscoveredAssembly => ({
  name: "hi",
  directory: "/p/src/assemblies/hi",
  view: "/p/src/assemblies/hi/hi.react.tsx",
  renderer: "react",
  client: undefined,
  service: undefined,
  styles: [],
  ...over,
});

describe("one assembly's browser half, as its own module", () => {
  it("hydrates a framework view through its renderer's browser half", () => {
    const source = generateClientModule(
      assembly({}),
      "/p/.assemblejs/client",
      "@asmjs/renderer-react",
    );
    expect(source).toContain('import { hydrate } from "@asmjs/renderer-react/client";');
    expect(source).toContain('import View from "../../src/assemblies/hi/hi.react.js";');
    expect(source).toContain("export default hydrate(View);");
  });

  it("has the compiler pass over the import of a Svelte or a Vue view, which it cannot read", () => {
    const source = generateClientModule(
      assembly({ view: "/p/src/assemblies/hi/hi.svelte", renderer: "svelte" }),
      "/p/.assemblejs/client",
      undefined,
    );
    expect(source).toContain(
      '// @ts-ignore: not TypeScript, and read by the build\nimport View from "../../src/assemblies/hi/hi.svelte";',
    );
    expect(source).toContain('import { hydrate } from "@asmjs/renderer-svelte/client";');
  });

  it("re-exports a plain html view's own browser behaviour", () => {
    const source = generateClientModule(
      assembly({
        renderer: "html",
        view: "/p/src/assemblies/hi/hi.html",
        client: "/p/src/assemblies/hi/hi.client.ts",
      }),
      "/p/.assemblejs/client",
      undefined,
    );
    expect(source).toContain('export { default } from "../../src/assemblies/hi/hi.client.js";');
  });

  it("re-exports a template view's own browser behaviour, as for html", () => {
    const source = generateClientModule(
      assembly({
        renderer: "handlebars",
        view: "/p/src/assemblies/hi/hi.hbs",
        client: "/p/src/assemblies/hi/hi.client.ts",
      }),
      "/p/.assemblejs/client",
      "@asmjs/renderer-templates",
    );
    expect(source).toContain('export { default } from "../../src/assemblies/hi/hi.client.js";');
    expect(source).not.toContain("hydrate");
  });
});
