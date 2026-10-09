// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer, registerAuthoringTools, resolveRoot } from "@assemblejs/mcp";

let dir = "";
let client: Client;

const call = async (name: string, args: Record<string, unknown>) => {
  const answer = await client.callTool({ name, arguments: args });
  const [first] = answer.content as Array<{ type: string; text: string }>;
  return JSON.parse(first?.text ?? "{}") as {
    ok: boolean;
    result: Record<string, unknown> | null;
    problems: unknown[];
  };
};

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-author-"));
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test-agent", version: "1.0.0" });
  await Promise.all([
    createMcpServer(resolveRoot(dir)).connect(serverSide),
    client.connect(clientSide),
  ]);
});
afterEach(async () => {
  await client.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("an agent building a page through the server's own surface", () => {
  // B-09b's proof, which needed these tools: create, add, place, compose and check, never once
  // touching the files directly, and the composed html carries what was added.
  it("creates a project, adds an assembly, places it, sees the page, and finds nothing wrong", async () => {
    expect((await call("create_project", { name: "shop" })).ok).toBe(true);

    const added = await call("add_assembly", { name: "cart", renderer: "html" });
    expect(added.result?.["tag"]).toBe('<assembly name="cart"></assembly>');

    const placed = await call("place_assembly", { page: "home", name: "cart", after: "hello" });
    expect(placed.ok).toBe(true);

    const composed = await call("compose_page", { template: String(placed.result?.["template"]) });
    const html = String(composed.result?.["html"]);
    expect(html).toContain('data-name="hello"');
    expect(html).toContain('data-name="cart"');
    expect(html).toContain("<p>cart</p>");

    expect(await call("check", {})).toMatchObject({ ok: true, problems: [] });
  });

  it("refuses with a fix through the protocol, and changes nothing", async () => {
    await call("create_project", { name: "shop" });
    const before = readFileSync(join(dir, "src", "pages", "home", "home.html"), "utf8");
    const answer = await call("place_assembly", { page: "home", name: "nope", at: "end" });
    expect(answer.ok).toBe(false);
    expect(answer.problems[0]).toMatchObject({ rule: "a-placement-names-an-assembly" });
    expect(readFileSync(join(dir, "src", "pages", "home", "home.html"), "utf8")).toBe(before);
  });
});

describe("registering the authoring tools", () => {
  it("adds the four tools to a server", async () => {
    const server = new McpServer({ name: "probe", version: "1.0.0" });
    registerAuthoringTools(server, resolveRoot(dir));
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const probe = new Client({ name: "probe", version: "1.0.0" });
    await Promise.all([server.connect(serverSide), probe.connect(clientSide)]);
    const { tools } = await probe.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "add_assembly",
      "check",
      "create_project",
      "place_assembly",
    ]);
    await probe.close();
  });
});
