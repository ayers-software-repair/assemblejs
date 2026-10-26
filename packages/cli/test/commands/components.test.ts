// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPONENTS } from "@asmjs/cli";

describe("the components a new project starts with", () => {
  it("style each element the memo names, by a class and the tokens, with a focus ring", () => {
    for (const selector of [
      ".button,\nbutton {",
      ".field {",
      ".field label {",
      ".list {",
      ".table {",
      ".notice {",
      "dialog {",
      ":focus-visible {",
      "a {",
    ]) {
      expect(COMPONENTS, selector).toContain(selector);
    }
    for (const state of [
      ".button:hover",
      ".button:disabled",
      '.field [aria-invalid="true"]',
      "dialog::backdrop",
    ]) {
      expect(COMPONENTS, state).toContain(state);
    }
  });

  it("names no colour of its own: every colour is a token", () => {
    expect(/#[0-9a-f]{3,8}\b/i.test(COMPONENTS)).toBe(false);
    expect(/\b(rgb|hsl|oklch)\(/.test(COMPONENTS)).toBe(false);
    expect(COMPONENTS.match(/var\(--/g)?.length ?? 0).toBeGreaterThan(30);
  });

  // Found 2026-10-11, in a browser: nothing styled the page itself. It was white, black and
  // Times New Roman, and in the dark scheme a dark notice stood on it with a link in the light
  // accent on white.
  it("style the page itself from the tokens: its ground, its ink and its type", () => {
    const body = /\nbody \{\n([^}]*)\}/.exec(COMPONENTS)?.[1] ?? "";
    for (const declared of [
      "background: var(--surface);",
      "color: var(--ink);",
      "font-family: var(--face-text);",
      "font-size: var(--text-2);",
      "margin: 0;",
    ]) {
      expect(body, declared).toContain(declared);
    }
  });
});
