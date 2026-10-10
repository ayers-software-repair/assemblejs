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
import { MCP_REGISTRATIONS, agentInstructions, agentProblems } from "@assemblejs/cli";
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

  // The registration that started this server in an empty directory is the commonest of them.
  it("scaffolds into a root that holds only what a project carries for its agents, and keeps it", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    const theirs = { command: "npx", args: ["-y", "other-server"] };
    writeFileSync(
      join(dir, ".mcp.json"),
      JSON.stringify({ mcpServers: { other: theirs, assemblejs: { command: "npx" } } }),
    );
    writeFileSync(join(dir, "AGENTS.md"), "# Ours\n\nOur own notes.\n");
    writeFileSync(join(dir, "CLAUDE.md"), "@AGENTS.md\n\nUse plan mode.\n");
    const answer = createProject(resolveRoot(dir), "shop");
    expect(answer.ok).toBe(true);
    const written = (answer.result as { written: string[] }).written;
    expect(written).toEqual(expect.arrayContaining(["package.json", "AGENTS.md", ".mcp.json"]));
    expect(written).not.toContain("CLAUDE.md");
    const registered = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8")) as {
      mcpServers: Record<string, unknown>;
    };
    expect(registered.mcpServers["other"]).toEqual(theirs);
    expect(registered.mcpServers["assemblejs"]).toEqual(MCP_REGISTRATIONS[0]?.entry);
    const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");
    expect(agents.startsWith("# Ours\n\nOur own notes.\n\n")).toBe(true);
    expect(agents).toContain(agentInstructions());
    expect(readFileSync(join(dir, "CLAUDE.md"), "utf8")).toBe("@AGENTS.md\n\nUse plan mode.\n");
    expect(agentProblems(dir)).toEqual([]);
  });

  it("refuses a registration it cannot read, before it has written anything", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    mkdirSync(join(dir, ".vscode"));
    writeFileSync(join(dir, ".vscode", "mcp.json"), '{\n  // ours\n  "servers": {}\n}');
    const answer = createProject(resolveRoot(dir), "shop");
    expect(answer.ok).toBe(false);
    expect(answer.problems).toEqual([
      {
        path: ".vscode/mcp.json",
        rule: "agent-instructions-are-current",
        message:
          ".vscode/mcp.json is not JSON, which a comment in it is enough to cause, and a server cannot be added to it without losing what it holds",
        fix: "correct it or remove it, then create the project again",
      },
    ]);
    expect(existsSync(join(dir, "package.json"))).toBe(false);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
  });

  it("refuses a root holding something that is no file where an agent file goes", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    mkdirSync(join(dir, "AGENTS.md"));
    const answer = createProject(resolveRoot(dir), "shop");
    expect(answer.problems[0]).toMatchObject({
      rule: "one-project-per-root",
      message: "this root already holds a project: AGENTS.md",
    });
    expect(existsSync(join(dir, "package.json"))).toBe(false);
  });

  it("refuses to read an instruction file through a link out of the root", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    writeFileSync(join(outside, "CLAUDE.md"), "@../AGENTS.md\n");
    symlinkSync(outside, join(dir, ".claude"));
    expect(() => createProject(resolveRoot(dir), "shop")).toThrow(OutsideRootError);
    expect(existsSync(join(dir, "package.json"))).toBe(false);
  });

  it("refuses a link out of the root where an agent file goes, read or written", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    writeFileSync(join(outside, "theirs.json"), "{}");
    symlinkSync(join(outside, "theirs.json"), join(dir, ".mcp.json"));
    expect(() => createProject(resolveRoot(dir), "shop")).toThrow(OutsideRootError);
    expect(readFileSync(join(outside, "theirs.json"), "utf8")).toBe("{}");
    expect(existsSync(join(dir, "package.json"))).toBe(false);
  });

  it("refuses a root holding a link where the starter would write, even one to nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-create-"));
    const outside = mkdtempSync(join(tmpdir(), "outside-"));
    symlinkSync(join(outside, "escaped.md"), join(dir, "README.md"));
    expect(() => createProject(resolveRoot(dir), "shop")).toThrow(OutsideRootError);
    expect(existsSync(join(outside, "escaped.md"))).toBe(false);
  });
});
