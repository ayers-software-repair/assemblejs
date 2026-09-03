// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { findRule } from "@assemblejs/mcp";

describe("asking why", () => {
  it("answers with the reason", () => {
    expect(findRule("no-default-credential")?.because).toContain("password");
  });

  it("answers nothing for a rule that does not exist, rather than guessing", () => {
    expect(findRule("invented-rule")).toBeUndefined();
  });
});
