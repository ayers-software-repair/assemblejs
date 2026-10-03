// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { generateClientModule } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

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
      "@assemblejs/renderer-react",
    );
    expect(source).toContain('import { hydrate } from "@assemblejs/renderer-react/client";');
    expect(source).toContain('import View from "../../src/assemblies/hi/hi.react.js";');
    expect(source).toContain("export default hydrate(View);");
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
});
