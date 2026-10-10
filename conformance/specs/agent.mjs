// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// What the specs of an agent share: what a project's own files tell an agent, the client an
// agent's host speaks the protocol with, as the project installed it with the server it
// registers, and that server started the way a registration file names it.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { envelopesOf } from "./http.mjs";

/** An agent's means in one project, from nothing but that project's files. */
export const agentIn = (root) => {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const told = read("AGENTS.md");
  // The name AGENTS.md tells an agent to look for, which is the name each registration uses.
  const [, name] = /Its MCP server, `([a-z-]+)`, is registered in/.exec(told) ?? [];
  const installed = createRequire(join(root, "node_modules", "@assemblejs", "mcp", "package.json"));
  const { Client } = installed("@modelcontextprotocol/sdk/client/index.js");
  const { StdioClientTransport } = installed("@modelcontextprotocol/sdk/client/stdio.js");

  /**
   * Starts the server a registration file names, the way the client that reads that file starts
   * it: its command and arguments as written, the workspace folder filled in where that client
   * fills it, in the directory and the environment given.
   */
  const startedFrom = async (file, servers, cwd, env) => {
    const entry = JSON.parse(read(file))[servers][name];
    const fill = (value) => value.replaceAll("${workspaceFolder}", root);
    const client = new Client({ name: "conformance-agent", version: "1.0.0" });
    await client.connect(
      new StdioClientTransport({
        command: fill(entry.command),
        args: entry.args.map(fill),
        cwd,
        env,
      }),
    );
    return client;
  };
  // As Claude Code starts a project's server: where the session is, with the project's root
  // named in the environment (the directory observed, the variable documented; DECISIONS
  // 2026-10-10).
  const started = () => startedFrom(".mcp.json", "mcpServers", root, { CLAUDE_PROJECT_DIR: root });
  /** The command line the project installed, run in the project. */
  const run = (...args) =>
    spawnSync("npx", ["assemblejs", ...args], { cwd: root, encoding: "utf8" });
  return { read, told, name, installed, startedFrom, started, run };
};

/** A resource's answer, read as the structure it is. */
export const resourceOf = async (client, uri) =>
  JSON.parse((await client.readResource({ uri })).contents[0].text);

/** A tool's answer, read as the structure it is. */
export const calling =
  (client) =>
  async (tool, args = {}) =>
    JSON.parse((await client.callTool({ name: tool, arguments: args })).content[0].text);

/**
 * Each envelope on a page by its assembly's name, with the markup its view rendered: what stands
 * before the data the envelope carries for the browser.
 */
export const named = (page) =>
  envelopesOf(page).map((envelope) => [
    envelope.attributes["data-name"],
    envelope.inner.split('<script type="application/json"')[0].trim(),
  ]);
