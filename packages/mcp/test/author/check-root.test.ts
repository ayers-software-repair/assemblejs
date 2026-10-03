// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkRoot, resolveRoot } from "@assemblejs/mcp";

describe("checking through the agent surface", () => {
  it("answers ok for a project with nothing wrong", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-check-"));
    writeFileSync(join(dir, "package.json"), "{}");
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "src", "server.ts"), "");
    expect(checkRoot(resolveRoot(dir))).toMatchObject({ ok: true, problems: [] });
  });

  it("answers every finding as a structure with its file, rule and fix", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-check-"));
    writeFileSync(join(dir, "package.json"), "{}");
    mkdirSync(join(dir, "src", "assemblies", "Cart"), { recursive: true });
    const answer = checkRoot(resolveRoot(dir));
    expect(answer.ok).toBe(false);
    expect(answer.problems[0]).toMatchObject({
      path: "src/assemblies/Cart",
      rule: "directory-is-an-assembly",
      fix: 'rename the directory to "cart"',
    });
  });
});
