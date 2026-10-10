// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { agentInstructions, bringsInAgents } from "@assemblejs/cli";

describe("whether a CLAUDE.md brings the project's AGENTS.md in", () => {
  it("does when it imports it, alone, above its own text or in the middle of a line", () => {
    expect(bringsInAgents("CLAUDE.md", "@AGENTS.md")).toBe(true);
    expect(bringsInAgents("CLAUDE.md", "@AGENTS.md\n\n## Claude Code\n\nUse plan mode.\n")).toBe(
      true,
    );
    expect(bringsInAgents("CLAUDE.md", "# shop\n\n- the rules: @AGENTS.md\n")).toBe(true);
  });

  it("does not when the import is only shown: in a code span or a fenced block", () => {
    expect(bringsInAgents("CLAUDE.md", "Add `@AGENTS.md` to import it.\n")).toBe(false);
    expect(bringsInAgents("CLAUDE.md", "Write `the line @AGENTS.md alone` to import it.\n")).toBe(
      false,
    );
    expect(bringsInAgents("CLAUDE.md", "```markdown\n@AGENTS.md\n```\n")).toBe(false);
    expect(bringsInAgents("CLAUDE.md", "~~~\n@AGENTS.md\n~~~\n\nNothing else.\n")).toBe(false);
  });

  it("does not when the block that shows it is never closed", () => {
    expect(bringsInAgents("CLAUDE.md", "Our notes.\n\n```\n@AGENTS.md\n")).toBe(false);
  });

  it("does when the import follows a block that only shows one", () => {
    expect(bringsInAgents("CLAUDE.md", "```\n@other.md\n```\n\n@AGENTS.md\n")).toBe(true);
  });

  it("does not for another file, an address, or no import at all", () => {
    expect(bringsInAgents("CLAUDE.md", "@README.md\n")).toBe(false);
    expect(bringsInAgents("CLAUDE.md", "write to someone@AGENTS.md\n")).toBe(false);
    expect(bringsInAgents("CLAUDE.md", "# shop\n\nOur own notes.\n")).toBe(false);
    expect(bringsInAgents("CLAUDE.md", "")).toBe(false);
  });

  // An import is resolved from the file that holds it, not from the project's root.
  it("reads the path from where the file is", () => {
    expect(bringsInAgents(".claude/CLAUDE.md", "@../AGENTS.md\n")).toBe(true);
    expect(bringsInAgents(".claude/CLAUDE.md", "@AGENTS.md\n")).toBe(false);
    expect(bringsInAgents("CLAUDE.md", "@./AGENTS.md\n")).toBe(true);
    expect(bringsInAgents("CLAUDE.md", "@docs/AGENTS.md\n")).toBe(false);
  });

  it("does when it is that file, through a link", () => {
    expect(bringsInAgents("CLAUDE.md", `# shop\n\n${agentInstructions()}\n`)).toBe(true);
  });
});
