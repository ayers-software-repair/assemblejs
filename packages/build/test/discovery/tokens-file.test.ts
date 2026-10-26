// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { TOKENS_FILE } from "@asmjs/build";

describe("where a project declares its tokens", () => {
  it("is one stylesheet under src", () => {
    expect(TOKENS_FILE).toBe("src/tokens.css");
  });
});
