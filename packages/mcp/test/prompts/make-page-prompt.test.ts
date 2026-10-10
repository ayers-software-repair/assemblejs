// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { pageDocument } from "@assemblejs/cli";
import { describe, expect, it } from "vitest";
import { MAKE_PAGE_PROMPT } from "@assemblejs/mcp";

describe("the brief for making a page", () => {
  const brief = MAKE_PAGE_PROMPT.brief({ name: "about" });

  it("names the page, where it is served and the file that is its whole document", () => {
    expect(brief).toContain('Make a page named "about", served at /about.');
    expect(brief).toContain("Write src/pages/about/about.html, the page's whole document");
    expect(MAKE_PAGE_PROMPT.brief({ name: "home" })).toContain("served at /.");
  });

  // One definition: the page an agent is handed is the page a new project is written with.
  it("hands over the document a new project's page is written with, with nothing placed", () => {
    const [, fenced] = /```html\n([\s\S]*?)```/.exec(brief) ?? [];
    expect(fenced).toBe(pageDocument("about"));
  });

  it("stops for a page that exists, and asks what belongs on one rather than choosing", () => {
    expect(brief).toContain("If src/pages/about exists, say so and stop.");
    expect(brief).toContain("If you were not told what belongs on it");
    expect(brief).toContain(
      'call place_assembly with { "page": "about", "name": the assembly\'s name }',
    );
  });

  it("says where a route, a placement's policy and a stream are declared, and only when needed", () => {
    expect(brief).toContain("src/pages/about/about.page.ts");
    expect(brief).toContain('definePage({ ... }) from "@assemblejs/core"');
    expect(brief).toContain("Write that file only when the page needs one of them.");
  });

  it("has the agent place, then compose, then check", () => {
    const at = ["call place_assembly", "call compose_page", "Call check"].map((word) =>
      brief.indexOf(word),
    );
    expect(at.every((index) => index > 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("takes the page's name alone", () => {
    expect(MAKE_PAGE_PROMPT.arguments.map(({ name, required }) => [name, required])).toEqual([
      ["name", true],
    ]);
  });
});
