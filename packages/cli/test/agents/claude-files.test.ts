// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { CLAUDE_FILES } from "@assemblejs/cli";

describe("the files Claude Code reads a project's instructions from", () => {
  it("are the one at the root, which the command line writes, and the one under .claude", () => {
    expect(CLAUDE_FILES).toEqual(["CLAUDE.md", ".claude/CLAUDE.md"]);
  });
});
