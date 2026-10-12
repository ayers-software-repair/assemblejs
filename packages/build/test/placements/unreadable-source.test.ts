// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { transformSync } from "esbuild";
import { describe, expect, it } from "vitest";
import { unreadableSource } from "@assemblejs/build";

const thrownBy = (source: string): unknown => {
  try {
    transformSync(source, { loader: "tsx" });
  } catch (error) {
    return error;
  }
  throw new Error("that compiled");
};

describe("the finding for a source file that does not compile", () => {
  it("names the file, the rule, and what the compiler said first, with its line", () => {
    const found = unreadableSource(
      "src/api/broken.api.ts",
      thrownBy('export default defineApi({ path: "/api/x",\n  handle: () => ({ }\n'),
    );
    expect(found).toEqual({
      path: "src/api/broken.api.ts",
      rule: "a-source-file-compiles",
      message: expect.stringMatching(/^broken\.api\.ts does not compile: .+ \(line \d+\)$/),
      fix: "correct it; until it compiles, nothing else about it can be checked",
    });
  });

  it("says what any other throw said, where it was not the compiler's", () => {
    expect(unreadableSource("src/api/x.api.ts", new Error("no default export")).message).toBe(
      "x.api.ts does not compile: no default export",
    );
  });
});
