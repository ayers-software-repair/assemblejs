// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { TemplateCompilerLoader } from "@assemblejs/cli";

describe("the project's own loader of a template engine's compiler", () => {
  it("answers, for an engine's name, a compiler of sources into renderers of input", async () => {
    const load: TemplateCompilerLoader = async () => (source) => () => source.toUpperCase();
    expect((await load("ejs"))("<p></p>")({})).toBe("<P></P>");
  });
});
