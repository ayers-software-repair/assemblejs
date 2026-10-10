// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { AGENTS_IMPORT, bringsInAgents } from "@assemblejs/cli";

describe("the line by which a CLAUDE.md brings AGENTS.md in", () => {
  it("is the import Claude Code documents for a file beside it", () => {
    expect(AGENTS_IMPORT).toBe("@AGENTS.md");
  });

  it("is one the command line's own reading of a CLAUDE.md accepts", () => {
    expect(bringsInAgents("CLAUDE.md", `${AGENTS_IMPORT}\n`)).toBe(true);
  });
});
