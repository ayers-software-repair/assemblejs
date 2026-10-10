// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { addAgents, agentFiles, agentInstructions, realIo } from "@assemblejs/cli";

const project = (files: Readonly<Record<string, string>> = {}): string => {
  const root = mkdtempSync(join(tmpdir(), "add-agents-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};
const told = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const io = {
    ...realIo,
    log: (line: string) => void logs.push(line),
    error: (line: string) => void errors.push(line),
  };
  return { io, logs, errors };
};
const MANIFEST = '{ "name": "shop", "devDependencies": { "@assemblejs/mcp": "^1.0.0" } }';
const ALL = ["AGENTS.md", "CLAUDE.md", ".mcp.json", ".cursor/mcp.json", ".vscode/mcp.json"];

describe("the add agents command", () => {
  it("gives a project that has none what a new one is written with, and says each file", () => {
    const root = project({ "package.json": MANIFEST });
    const { io, logs } = told();
    expect(addAgents(root, io)).toBe(0);
    for (const [path, contents] of Object.entries(agentFiles("shop").files)) {
      expect(readFileSync(join(root, path), "utf8"), path).toBe(contents);
    }
    expect(logs).toEqual(ALL.map((path) => `wrote ${path}`));
  });

  it("titles a new AGENTS.md with the directory where the manifest gives no name", () => {
    const root = project({ "package.json": "{}" });
    addAgents(root, told().io);
    expect(readFileSync(join(root, "AGENTS.md"), "utf8")).toBe(
      `# ${basename(root)}\n\n${agentInstructions()}\n`,
    );
  });

  it("brings up to date what the project has, and writes only the files that change", () => {
    const stale = agentFiles("shop").files["AGENTS.md"]?.replace("## The rules", "## Rules") ?? "";
    const root = project({
      "package.json": MANIFEST,
      ...agentFiles("shop").files,
      "AGENTS.md": `Our own notes.\n\n${stale}`,
    });
    const { io, logs } = told();
    expect(addAgents(root, io)).toBe(0);
    expect(logs).toEqual(["wrote AGENTS.md"]);
    expect(readFileSync(join(root, "AGENTS.md"), "utf8")).toBe(
      `Our own notes.\n\n# shop\n\n${agentInstructions()}\n`,
    );
  });

  it("writes nothing that is already current, and says that it is", () => {
    const root = project({ "package.json": MANIFEST, ...agentFiles("shop").files });
    const { io, logs } = told();
    expect(addAgents(root, io)).toBe(0);
    expect(logs).toEqual(["the agent instructions and registrations are current"]);
  });

  // Some of a project's agent files rewritten and one not is worse than none rewritten.
  it("refuses a registration it cannot read, before it has written anything", () => {
    const root = project({ "package.json": MANIFEST, ".cursor/mcp.json": "{ not json" });
    const { io, logs, errors } = told();
    expect(addAgents(root, io)).toBe(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toBe(
      ".cursor/mcp.json is not JSON, which a comment in it is enough to cause, and a server cannot be added to it without losing what it holds: correct it or remove it, then run this again",
    );
    expect(logs).toEqual([]);
    expect(readFileSync(join(root, ".cursor/mcp.json"), "utf8")).toBe("{ not json");
    expect(existsSync(join(root, "AGENTS.md"))).toBe(false);
  });

  it("says what to install where the project does not depend on the server it registered", () => {
    const { io, logs } = told();
    addAgents(project({ "package.json": '{ "name": "shop" }' }), io);
    expect(logs.at(-1)).toBe(
      "\ninstall the server they register: npm install --save-dev @assemblejs/mcp",
    );
    const depended = told();
    addAgents(project({ "package.json": MANIFEST }), depended.io);
    expect(depended.logs.join("\n")).not.toContain("npm install");
  });
});
