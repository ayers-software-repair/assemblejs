// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ToolResult } from "@assemblejs/mcp";

describe("what a tool answers with", () => {
  it("is a structure, and carries what to do next", () => {
    const answer: ToolResult = {
      ok: true,
      result: { html: "<p>x</p>" },
      problems: [],
      next: ["place it on a page"],
    };
    // Never prose: an agent that has to parse a sentence written for a person is guessing.
    expect(typeof answer.ok).toBe("boolean");
    expect(Array.isArray(answer.problems)).toBe(true);
  });
});
