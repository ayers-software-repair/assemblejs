// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { sharedOptions } from "@assemblejs/cli";

describe("what both bundles agree on", () => {
  it("reads a template as text and leaves stylesheets out until they are scoped", () => {
    const options = sharedOptions({ root: "/p", side: "server", assemblies: [], compilers: {} });
    expect(options.absWorkingDir).toBe("/p");
    expect(options.loader).toEqual({ ".html": "text", ".md": "text", ".css": "empty" });
    expect(options.jsx).toBe("automatic");
    expect(options.plugins?.map((plugin) => plugin.name)).toEqual(["assemblejs-jsx"]);
  });

  it("compiles Svelte and Vue only when the project has their compilers", () => {
    const svelte = () => ({ js: { code: "" } });
    const vue = {} as never;
    expect(
      sharedOptions({
        root: "/p",
        side: "client",
        assemblies: [],
        compilers: { svelte, vue },
      }).plugins?.map((plugin) => plugin.name),
    ).toEqual(["assemblejs-jsx", "assemblejs-svelte", "assemblejs-vue"]);
  });
});
