// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { PROMPTS } from "@assemblejs/mcp";

describe("what a person asks an agent for most", () => {
  it("is an assembly, its place, a page and what check found, in the order a project grows", () => {
    expect(PROMPTS.map((prompt) => prompt.name)).toEqual([
      "add_assembly",
      "place_assembly",
      "make_page",
      "fix_findings",
    ]);
  });

  it("gives each a title a client can show and a sentence that says what it does", () => {
    for (const prompt of PROMPTS) {
      expect(prompt.title.length, prompt.name).toBeGreaterThan(5);
      expect(prompt.description.endsWith("."), prompt.name).toBe(true);
    }
  });

  // An agent that was briefed and never told to check has been told it is done too soon.
  it("ends every brief with check, and has every brief open with what was asked for", () => {
    for (const prompt of PROMPTS) {
      const brief = prompt.brief({ name: "cart", on: "home", renderer: "html" });
      expect(brief.split("\n")[0]?.endsWith("."), prompt.name).toBe(true);
      expect(brief.trimEnd().split("\n").at(-1), prompt.name).toMatch(/check/);
    }
  });
});
