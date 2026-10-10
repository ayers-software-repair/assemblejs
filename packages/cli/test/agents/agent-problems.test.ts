// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  agentFiles,
  agentInstructions,
  agentProblems,
  checkProject,
  projectFiles,
} from "@assemblejs/cli";

const project = (files: Readonly<Record<string, string>> = {}): string => {
  const root = mkdtempSync(join(tmpdir(), "agent-problems-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};
const MANIFEST = '{ "devDependencies": { "@assemblejs/mcp": "^1.0.0" } }';
const fresh = agentFiles("shop").files;
const AGENTS = fresh["AGENTS.md"] ?? "";
const REWRITE = expect.stringContaining("run assemblejs add agents") as unknown as string;
const found = (root: string) =>
  agentProblems(root).map(({ path, message }) => [path.slice(root.length + 1), message]);

describe("what is out of date in the agent files a project carries", () => {
  it("is nothing in a project as new wrote it, or in one that carries none", () => {
    expect(agentProblems(project(projectFiles("shop")))).toEqual([]);
    expect(agentProblems(project({ "package.json": "{}" }))).toEqual([]);
    expect(agentProblems(project())).toEqual([]);
  });

  it("is the marked part of AGENTS.md when it is not what this version writes", () => {
    const root = project({
      "package.json": MANIFEST,
      "AGENTS.md": AGENTS.replace("## The rules", "## Some rules"),
    });
    expect(agentProblems(root)).toEqual([
      {
        path: join(root, "AGENTS.md"),
        rule: "agent-instructions-are-current",
        message: "the agent instructions are not the ones this version of assemblejs writes",
        fix: REWRITE,
      },
    ]);
  });

  it("is never what the project wrote around that part, nor how its lines end", () => {
    const own = `# shop\n\nOur own notes.\n\n${agentInstructions()}\n\n## Deploys\n`;
    expect(agentProblems(project({ "AGENTS.md": own }))).toEqual([]);
    expect(agentProblems(project({ "AGENTS.md": AGENTS.replaceAll("\n", "\r\n") }))).toEqual([]);
  });

  it("is a CLAUDE.md that hides those instructions from Claude Code", () => {
    const hidden = project({ "AGENTS.md": AGENTS, "CLAUDE.md": "# Claude Code\n\nOurs.\n" });
    expect(found(hidden)).toEqual([
      [
        "CLAUDE.md",
        "Claude Code reads this file in place of AGENTS.md, and it does not bring AGENTS.md in with @AGENTS.md",
      ],
    ]);
    const under = project({ "AGENTS.md": AGENTS, ".claude/CLAUDE.md": "Ours.\n" });
    expect(found(under).map(([path]) => path)).toEqual([join(".claude", "CLAUDE.md")]);
  });

  it("is no CLAUDE.md that brings them in, from either place, nor one beside no instructions", () => {
    expect(agentProblems(project({ "AGENTS.md": AGENTS, "CLAUDE.md": "@AGENTS.md\n" }))).toEqual(
      [],
    );
    expect(
      agentProblems(
        project({
          "AGENTS.md": AGENTS,
          "CLAUDE.md": "Ours.\n",
          ".claude/CLAUDE.md": "@../AGENTS.md",
        }),
      ),
    ).toEqual([]);
    expect(agentProblems(project({ "AGENTS.md": "# shop\n", "CLAUDE.md": "Ours.\n" }))).toEqual([]);
    expect(agentProblems(project({ "CLAUDE.md": "Ours.\n" }))).toEqual([]);
  });

  it("is this project's server in a registration, when it is not registered as this version does", () => {
    const root = project({
      "package.json": MANIFEST,
      ".vscode/mcp.json": JSON.stringify({
        servers: {
          other: { command: "x" },
          assemblejs: { command: "npx", args: ["assemblejs-mcp"] },
        },
      }),
      ".mcp.json": JSON.stringify({ mcpServers: { other: { command: "anything" } } }),
      ".cursor/mcp.json": "{ not json",
    });
    expect(found(root)).toEqual([
      [
        join(".vscode", "mcp.json"),
        'the server "assemblejs" is not registered the way this version of assemblejs registers it',
      ],
    ]);
  });

  it("is never a registration that says the same thing in another order", () => {
    const reordered =
      '{"mcpServers":{"assemblejs":{"args":["node_modules/@assemblejs/mcp/dist/bin.js"],"command":"node","type":"stdio"}}}';
    expect(agentProblems(project({ "package.json": MANIFEST, ".mcp.json": reordered }))).toEqual(
      [],
    );
  });

  it("is a registered server the project does not depend on", () => {
    const root = project({ "package.json": "{}", ".mcp.json": fresh[".mcp.json"] ?? "" });
    expect(agentProblems(root)).toEqual([
      {
        path: join(root, "package.json"),
        rule: "agent-instructions-are-current",
        message:
          'the server "assemblejs" is registered, and the project does not depend on @assemblejs/mcp, which carries it',
        fix: "npm install --save-dev @assemblejs/mcp",
      },
    ]);
    const named = '{ "scripts": { "mcp": "npx @assemblejs/mcp" } }';
    expect(
      found(project({ "package.json": named, ".mcp.json": fresh[".mcp.json"] ?? "" })),
    ).toHaveLength(1);
  });

  // Each would call the other's instructions out of date, and rewriting them satisfies one.
  it("is one thing alone where the agent surface is built on another command line than the one installed", () => {
    const installed = (builtOn: string, beside: string) => ({
      "node_modules/@assemblejs/mcp/package.json": JSON.stringify({
        dependencies: { "@assemblejs/cli": builtOn },
      }),
      "node_modules/@assemblejs/cli/package.json": JSON.stringify({ version: beside }),
    });
    const stale = {
      ...projectFiles("shop"),
      "AGENTS.md": AGENTS.replace("## The rules", "## Rules"),
    };
    const root = project({ ...stale, ...installed("1.0.0", "1.1.0") });
    expect(agentProblems(root)).toEqual([
      {
        path: join(root, "package.json"),
        rule: "agent-instructions-are-current",
        message:
          "the @assemblejs/mcp this project installs is built on @assemblejs/cli 1.0.0, and the project installs 1.1.0: each writes and checks its own agent instructions",
        fix: "bring the two to versions released together: npm update @assemblejs/cli @assemblejs/mcp",
      },
    ]);
    // Released together, what is out of date is judged again.
    expect(found(project({ ...stale, ...installed("1.1.0", "1.1.0") }))).toHaveLength(1);
    expect(found(project({ ...stale, ...installed("1.1.0", "1.1.0") }))[0]?.[0]).toBe("AGENTS.md");
  });

  it("is never that, where the two cannot be compared or the project carries no agent files", () => {
    const both = (builtOn: string, beside: string) => ({
      "node_modules/@assemblejs/mcp/package.json": JSON.stringify({
        dependencies: { "@assemblejs/cli": builtOn },
      }),
      "node_modules/@assemblejs/cli/package.json": JSON.stringify({ version: beside }),
    });
    const fresh = projectFiles("shop");
    // A workspace names its own packages its own way, and a range is no version to compare.
    expect(agentProblems(project({ ...fresh, ...both("workspace:*", "1.1.0") }))).toEqual([]);
    expect(agentProblems(project({ ...fresh, ...both("^1.0.0", "1.1.0") }))).toEqual([]);
    // Only one of the two installed where the project's files are looked for.
    const { "node_modules/@assemblejs/cli/package.json": _cli, ...onlyServer } = both(
      "1.0.0",
      "1.1.0",
    );
    expect(agentProblems(project({ ...fresh, ...onlyServer }))).toEqual([]);
    expect(agentProblems(project({ "package.json": "{}", ...both("1.0.0", "1.1.0") }))).toEqual([]);
  });

  it("is reported by check, at the file from the project's root, with its rule", async () => {
    const root = project({
      ...projectFiles("shop"),
      "AGENTS.md": AGENTS.replace("## The rules", "## Rules"),
    });
    expect(await checkProject(root)).toMatchObject([
      { path: "AGENTS.md", rule: "agent-instructions-are-current" },
    ]);
  });

  // An agent file that leads out of the project is not read: it is one the project does not
  // have, and that it leads out is a finding of its own.
  it("is an agent file that leads out of the project, which is not read to be judged", () => {
    const outside = project({ "AGENTS.md": AGENTS.replace("## The rules", "## SECRET rules") });
    const root = project({ "package.json": MANIFEST });
    symlinkSync(join(outside, "AGENTS.md"), join(root, "AGENTS.md"));
    expect(
      agentProblems(root).map(({ path, rule }) => [path.slice(root.length + 1), rule]),
    ).toEqual([["AGENTS.md", "a-project-stays-inside-its-root"]]);
    expect(JSON.stringify(agentProblems(root))).not.toContain("SECRET");
  });
});
