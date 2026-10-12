// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { tokenProblems } from "@assemblejs/build";

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));
const project = (tokens?: string): string => {
  root = mkdtempSync(join(tmpdir(), "tokens-"));
  mkdirSync(join(root, "src"), { recursive: true });
  if (tokens !== undefined) writeFileSync(join(root, "src", "tokens.css"), tokens);
  return root;
};

describe("what is wrong with a project's tokens", () => {
  it("is nothing for a project without the file, or for roles it cannot judge", () => {
    expect(tokenProblems(project())).toEqual([]);
    expect(tokenProblems(project(":root { --ink: var(--brand); --surface: white; }"))).toEqual([]);
  });

  it("holds a control's colour to 3:1, and the light scheme as the dark", () => {
    const faint = ":root { --surface: #ffffff; --accent: #9ccfc3; --ink: #000; }";
    expect(tokenProblems(project(faint)).map((one) => one.message)).toEqual([
      "--accent on --surface is 1.73:1 in the light scheme; what identifies a control needs 3:1 (WCAG 2.2, 1.4.11)",
      "--accent on --surface is 1.73:1 in the dark scheme; what identifies a control needs 3:1 (WCAG 2.2, 1.4.11)",
    ]);
  });

  it("holds the line exactly: 4.48:1 is under 4.5, and 4.54:1 is not", () => {
    const under = ":root { --ink: #777777; --surface: #ffffff; }";
    expect(tokenProblems(project(under)).map((one) => one.message)).toEqual([
      "--ink on --surface is 4.47:1 in the light scheme; text needs 4.5:1 (WCAG 2.2, 1.4.3)",
      "--ink on --surface is 4.47:1 in the dark scheme; text needs 4.5:1 (WCAG 2.2, 1.4.3)",
    ]);
    expect(tokenProblems(project(":root { --ink: #767676; --surface: #ffffff; }"))).toEqual([]);
  });

  it("reports a tokens file it cannot read as one finding, where it breaks", () => {
    const found = tokenProblems(project(":root { --ink: "));
    expect(found).toHaveLength(1);
    expect(found[0]?.path).toBe(join(root, "src", "tokens.css"));
    expect(found[0]?.message).toContain("line 1, column");
    expect(found[0]?.message).toContain("is not CSS the check can read");
  });
});
