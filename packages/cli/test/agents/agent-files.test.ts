// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { MCP_REGISTRATIONS, agentFiles, agentInstructions } from "@assemblejs/cli";

const fresh = agentFiles("shop").files;
const having =
  (files: Readonly<Record<string, string>>) =>
  (path: string): string | undefined =>
    files[path];
const STALE =
  "<!-- assemblejs:instructions, as an earlier version wrote them -->\nold rules\n<!-- /assemblejs:instructions -->";

describe("what a project with no agent files is written with", () => {
  it("is the instructions, the file that brings them to Claude Code, and each registration", () => {
    expect(Object.keys(fresh)).toEqual([
      "AGENTS.md",
      "CLAUDE.md",
      ".mcp.json",
      ".cursor/mcp.json",
      ".vscode/mcp.json",
    ]);
    expect(agentFiles("shop").unreadable).toEqual([]);
  });

  it("titles AGENTS.md with the project, above the part that is kept current", () => {
    expect(fresh["AGENTS.md"]).toBe(`# shop\n\n${agentInstructions()}\n`);
  });

  it("writes a CLAUDE.md that is the one import and nothing else", () => {
    expect(fresh["CLAUDE.md"]).toBe("@AGENTS.md\n");
  });

  it("registers the server under its name, as JSON each client reads", () => {
    for (const registration of MCP_REGISTRATIONS) {
      expect(JSON.parse(fresh[registration.path] ?? ""), registration.path).toEqual({
        [registration.servers]: { assemblejs: registration.entry },
      });
    }
  });
});

describe("what a project that has agent files is written with", () => {
  it("is nothing, when every one is as this version writes it", () => {
    expect(agentFiles("shop", having(fresh))).toEqual({ files: {}, unreadable: [] });
  });

  it("is its own part of AGENTS.md rewritten, and what the project wrote around it kept", () => {
    const own = `# shop\n\nOur own notes.\n\n${STALE}\n\n## Deploys\n\nOn Fridays.\n`;
    expect(agentFiles("shop", having({ ...fresh, "AGENTS.md": own })).files).toEqual({
      "AGENTS.md": `# shop\n\nOur own notes.\n\n${agentInstructions()}\n\n## Deploys\n\nOn Fridays.\n`,
    });
  });

  // What check finds current, add agents does not write: the two never disagree.
  it("is no AGENTS.md whose part is current, however the checkout ends its lines", () => {
    const checkedOut = (fresh["AGENTS.md"] ?? "").replaceAll("\n", "\r\n");
    expect(agentFiles("shop", having({ ...fresh, "AGENTS.md": checkedOut })).files).toEqual({});
  });

  it("is its part added beneath an AGENTS.md the project wrote with none", () => {
    const own = "# shop\n\nOur own notes.\n\n\n";
    expect(agentFiles("renamed", having({ ...fresh, "AGENTS.md": own })).files).toEqual({
      "AGENTS.md": `# shop\n\nOur own notes.\n\n${agentInstructions()}\n`,
    });
  });

  it("is the import put above a CLAUDE.md that does not bring AGENTS.md in", () => {
    const own = "# Claude Code\n\nUse plan mode under src/billing.\n";
    expect(agentFiles("shop", having({ ...fresh, "CLAUDE.md": own })).files).toEqual({
      "CLAUDE.md": `@AGENTS.md\n\n${own}`,
    });
  });

  it("is no CLAUDE.md at all where the one under .claude brings AGENTS.md in already", () => {
    const { "CLAUDE.md": _none, ...rest } = fresh;
    expect(
      agentFiles("shop", having({ ...rest, ".claude/CLAUDE.md": "@../AGENTS.md\n" })).files,
    ).toEqual({});
    expect(
      agentFiles("shop", having({ ...rest, ".claude/CLAUDE.md": "Ours alone.\n" })).files,
    ).toEqual({ "CLAUDE.md": "@AGENTS.md\n" });
  });

  it("is its own server set in a registration, every other server and setting kept", () => {
    const own = JSON.stringify({
      inputs: [{ id: "token" }],
      mcpServers: { other: { command: "x" }, assemblejs: { command: "node", args: ["old.js"] } },
    });
    const { files } = agentFiles("shop", having({ ...fresh, ".mcp.json": own }));
    expect(Object.keys(files)).toEqual([".mcp.json"]);
    expect(JSON.parse(files[".mcp.json"] ?? "")).toEqual({
      inputs: [{ id: "token" }],
      mcpServers: { other: { command: "x" }, assemblejs: MCP_REGISTRATIONS[0]?.entry },
    });
  });

  it("is its server added to a registration that lists only others, or lists none", () => {
    const others = '{ "servers": { "other": { "command": "x" } } }';
    const { files } = agentFiles(
      "shop",
      having({ ...fresh, ".vscode/mcp.json": others, ".cursor/mcp.json": "{}" }),
    );
    expect(JSON.parse(files[".vscode/mcp.json"] ?? "")).toEqual({
      servers: { other: { command: "x" }, assemblejs: MCP_REGISTRATIONS[2]?.entry },
    });
    expect(JSON.parse(files[".cursor/mcp.json"] ?? "")).toEqual({
      mcpServers: { assemblejs: MCP_REGISTRATIONS[1]?.entry },
    });
  });

  // The same registration with its keys in another order and no indentation is the same one.
  it("leaves a registration that says the same thing exactly as its author formatted it", () => {
    const compact =
      '{"mcpServers":{"assemblejs":{"args":["node_modules/@assemblejs/mcp/dist/bin.js"],"command":"node","type":"stdio"}}}';
    expect(agentFiles("shop", having({ ...fresh, ".mcp.json": compact })).files).toEqual({});
  });

  it("names a registration it cannot read, writes it nothing, and still answers the rest", () => {
    const answer = agentFiles(
      "shop",
      having({ ".vscode/mcp.json": '{\n  // ours\n  "servers": {}\n}', ".mcp.json": "[]" }),
    );
    expect(answer.unreadable).toEqual([".mcp.json", ".vscode/mcp.json"]);
    expect(Object.keys(answer.files)).toEqual(["AGENTS.md", "CLAUDE.md", ".cursor/mcp.json"]);
  });
});
