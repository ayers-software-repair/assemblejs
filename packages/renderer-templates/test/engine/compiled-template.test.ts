// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { CompiledTemplate } from "@assemblejs/renderer-templates";

describe("a compiled template", () => {
  it("renders each placement from that placement's own input", () => {
    const template: CompiledTemplate = (input) => String(input.data["n"]);
    expect([1, 2].map((n) => template({ data: { n }, children: {} }))).toEqual(["1", "2"]);
  });
});
