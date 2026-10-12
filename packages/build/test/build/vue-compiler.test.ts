// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadVueCompiler } from "@assemblejs/build";
import type { VueCompiler } from "@assemblejs/build";

describe("the functions of Vue's compiler a build calls", () => {
  it("are the project's own Vue's", async () => {
    const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
    const compiler: VueCompiler | undefined = await loadVueCompiler(example);
    expect(
      ["parse", "compileScript", "compileTemplate", "compileStyle"].every(
        (name) => typeof compiler?.[name as keyof VueCompiler] === "function",
      ),
    ).toBe(true);
  });
});
