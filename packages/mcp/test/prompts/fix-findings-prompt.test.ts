// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { FIX_FINDINGS_PROMPT } from "@assemblejs/mcp";

describe("the brief for fixing what check finds", () => {
  const brief = FIX_FINDINGS_PROMPT.brief({});

  it("has the agent check, fix by the fix a finding names, and check again", () => {
    const at = [
      "Call check.",
      "call explain with",
      "Make the change the fix names",
      "Call check again",
    ].map((word) => brief.indexOf(word));
    expect(at.every((index) => index > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  // The cheapest way to silence a finding is to delete what it is about.
  it("keeps a fix to what the finding names, and from removing what it is about", () => {
    expect(brief).toContain("in the file the finding names, and nothing wider");
    expect(brief).toContain(
      "Do not clear a finding by removing the placement, the page or the assembly it is about",
    );
  });

  it("says a fix that is a command is for a shell, which this server does not run", () => {
    expect(brief).toContain("is for a shell, and this server runs none");
  });

  it("ends when check finds nothing, with what was changed", () => {
    expect(brief).toContain("Stop when check answers with no findings");
    expect(FIX_FINDINGS_PROMPT.arguments).toEqual([]);
  });
});
