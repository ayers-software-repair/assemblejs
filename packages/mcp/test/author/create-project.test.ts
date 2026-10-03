// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, resolveRoot } from "@assemblejs/mcp";

describe("scaffolding a project through the agent surface", () => {
  it("writes the command line's own project into the root, and says every file it wrote", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    const answer = createProject(resolveRoot(dir), "shop");
    expect(answer.ok).toBe(true);
    expect((answer.result as { written: string[] }).written).toContain("src/pages/home/home.html");
    expect(existsSync(join(dir, "src", "server.ts"))).toBe(true);
  });

  it("refuses a root that already holds a project, and a name that is not usable", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    writeFileSync(join(dir, "package.json"), "{}");
    expect(createProject(resolveRoot(dir), "shop").problems[0]).toMatchObject({
      rule: "one-project-per-root",
      fix: "add to it with add_assembly instead",
    });
    const empty = mkdtempSync(join(tmpdir(), "mcp-create-"));
    expect(createProject(resolveRoot(empty), "My Shop").problems[0]).toMatchObject({
      fix: 'call it "my-shop"',
    });
    expect(existsSync(join(empty, "package.json"))).toBe(false);
  });
});
