// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { PLACE_ASSEMBLY_PROMPT } from "@assemblejs/mcp";

describe("the brief for placing an assembly", () => {
  it("gives both calls for a place that is named: a page, or another assembly", () => {
    const brief = PLACE_ASSEMBLY_PROMPT.brief({ name: "cart", on: "home" });
    expect(brief).toContain('Place the assembly "cart" on "home".');
    expect(brief).toContain('call place_assembly with { "page": "home", "name": "cart" }');
    expect(brief).toContain('call it with { "in": "home", "name": "cart" }');
  });

  // An agent that picks a page nobody named has put the assembly somewhere nobody asked for.
  it("has the agent ask, and gives it no call to make, when no place is named", () => {
    const brief = PLACE_ASSEMBLY_PROMPT.brief({ name: "cart" });
    expect(brief).toContain('Place the assembly "cart".');
    expect(brief).toContain("Ask which page, or which assembly, and do not choose one yourself.");
    expect(brief).not.toContain('"page":');
    expect(brief).not.toContain('"in":');
  });

  it("says what a framework view answers with, which is a line to write and not an edit", () => {
    expect(PLACE_ASSEMBLY_PROMPT.brief({ name: "cart", on: "shell" })).toContain(
      "the answer is the line to write and what it imports",
    );
  });

  it("has the agent see what the placement made, and read the account and not only the markup", () => {
    const brief = PLACE_ASSEMBLY_PROMPT.brief({ name: "cart", on: "home" });
    expect(brief).toContain('call compose_page with { "template": the file\'s text }');
    expect(brief).toContain("call render_assembly with");
    expect(brief).toContain("a placement that fell back looks the same in the markup");
    expect(brief.indexOf("compose_page")).toBeLessThan(brief.indexOf("Call check"));
  });

  it("takes the assembly, and a place that may be left out", () => {
    expect(PLACE_ASSEMBLY_PROMPT.arguments.map(({ name, required }) => [name, required])).toEqual([
      ["name", true],
      ["on", false],
    ]);
  });
});
