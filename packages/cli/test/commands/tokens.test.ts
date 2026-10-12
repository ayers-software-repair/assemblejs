// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { tokenProblems } from "@assemblejs/build";
import { afterEach, describe, expect, it } from "vitest";
import { TOKENS } from "@assemblejs/cli";

describe("the tokens a new project starts with", () => {
  it("declare every role at :root, the three scales, and a dark scheme rebinding the colours", () => {
    for (const role of [
      "--surface",
      "--surface-panel",
      "--border",
      "--ink",
      "--ink-muted",
      "--accent",
      "--accent-strong",
      "--accent-alt",
      "--accent-wash",
      "--face-display",
      "--face-text",
      "--face-mono",
    ]) {
      expect(TOKENS.split(`${role}:`).length - 1, role).toBe(role.startsWith("--face") ? 1 : 2);
    }
    for (const scale of ["--space-1", "--space-4", "--text-1", "--text-4", "--corner"]) {
      expect(TOKENS).toContain(`${scale}:`);
    }
    expect(TOKENS).toContain("@media (prefers-color-scheme: dark)");
    expect(TOKENS.trimStart().startsWith("/*")).toBe(true);
  });

  // Found 2026-10-11, in a browser set to the dark scheme: the tokens flipped and the browser's
  // own surface, its scrollbars and its form controls did not.
  it("say the page is made for both schemes, so what the browser draws follows the tokens", () => {
    expect(TOKENS).toContain(":root {\n  color-scheme: light dark;");
  });
});

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));
const project = (tokens: string): string => {
  root = mkdtempSync(join(tmpdir(), "tokens-"));
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "src", "tokens.css"), tokens);
  return root;
};

describe("the contrast of the tokens a new project starts with", () => {
  it("holds in both schemes: the check finds nothing wrong with them", () => {
    expect(tokenProblems(project(TOKENS))).toEqual([]);
  });

  it("names the role, the ground, the ratio, the scheme and WCAG's number for a binding that breaks", () => {
    const broken = TOKENS.replace("--ink-muted: #c9c2b0;", "--ink-muted: #5a5a5a;");
    expect(broken).not.toBe(TOKENS);
    const found = tokenProblems(project(broken));
    expect(found.map((one) => one.rule)).toEqual(found.map(() => "tokens-hold-their-contrast"));
    expect(found.map((one) => one.path)).toEqual(found.map(() => join(root, "src", "tokens.css")));
    expect(found.map((one) => one.message)).toEqual([
      "--ink-muted on --surface is 2.64:1 in the dark scheme; text needs 4.5:1 (WCAG 2.2, 1.4.3)",
      "--ink-muted on --surface-panel is 2.38:1 in the dark scheme; text needs 4.5:1 (WCAG 2.2, 1.4.3)",
      "--ink-muted on --accent-wash is 2.14:1 in the dark scheme; text needs 4.5:1 (WCAG 2.2, 1.4.3)",
    ]);
    expect(found[0]?.fix).toContain("rebind --ink-muted or --surface in the dark scheme");
  });
});
