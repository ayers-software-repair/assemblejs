// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createProject, OutsideRootError, resolveRoot } from "@assemblejs/mcp";

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

  it("refuses a root holding any file the starter would write, package.json or not", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "src", "server.ts"), "// the author's own");
    const answer = createProject(resolveRoot(dir), "shop");
    expect(answer.ok).toBe(false);
    expect(readFileSync(join(dir, "src", "server.ts"), "utf8")).toBe("// the author's own");
  });

  it("refuses a root holding a link where the starter would write, even one to nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    symlinkSync(join(outside, "escaped.md"), join(dir, "README.md"));
    expect(() => createProject(resolveRoot(dir), "shop")).toThrow(OutsideRootError);
    expect(existsSync(join(outside, "escaped.md"))).toBe(false);
  });
});
