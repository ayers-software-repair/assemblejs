// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { SvelteCompile } from "@assemblejs/cli";

describe("the one Svelte compiler function a build calls", () => {
  it("takes a source and a side, and answers the compiled javascript", () => {
    const compile: SvelteCompile = (source, options) => ({
      js: { code: `// ${options.generate}\n${source}` },
    });
    expect(compile("x", { filename: "a.svelte", generate: "server" }).js.code).toContain("server");
  });
});
