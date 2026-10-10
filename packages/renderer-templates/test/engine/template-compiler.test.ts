// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { TemplateCompiler } from "@assemblejs/renderer-templates";

describe("a template compiler", () => {
  it("compiles a source once into a template rendered many times", () => {
    const compile: TemplateCompiler = (source) => (input) => source + String(input.data["n"]);
    const template = compile("n=");
    expect(template({ data: { n: 1 } })).toBe("n=1");
  });
});
