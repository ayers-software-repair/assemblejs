// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { sharedOptions } from "@assemblejs/cli";

describe("what both bundles agree on", () => {
  it("reads a template as text and leaves stylesheets out until they are scoped", () => {
    const options = sharedOptions("/p", undefined, "server");
    expect(options.absWorkingDir).toBe("/p");
    expect(options.loader).toEqual({ ".html": "text", ".md": "text", ".css": "empty" });
    expect(options.jsx).toBe("automatic");
    expect(options.plugins).toEqual([]);
  });

  it("compiles Svelte only when the project has a compiler", () => {
    const compile = () => ({ js: { code: "" } });
    expect(sharedOptions("/p", compile, "client").plugins).toHaveLength(1);
  });
});
