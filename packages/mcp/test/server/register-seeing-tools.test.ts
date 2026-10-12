// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerSeeingTools, resolveRoot } from "@assemblejs/mcp";
import type { ToolResult } from "@assemblejs/mcp";
import { devServer } from "../fixtures/dev-server.js";

let dir = "";
let client: Client;
const file = (path: string, contents: string): void => {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), contents);
};
const call = async (name: string, given: Record<string, unknown>): Promise<ToolResult> => {
  const { content } = await client.callTool({ name, arguments: given });
  return JSON.parse((content as Array<{ text: string }>)[0]?.text ?? "") as ToolResult;
};

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-seeing-"));
  const server = new McpServer({ name: "seeing", version: "0.0.0" });
  registerSeeingTools(server, resolveRoot(dir));
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "an-agent", version: "1.0.0" });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
});
afterEach(async () => {
  await client.close();
  rmSync(dir, { recursive: true, force: true });
});

const dev = devServer();

describe("the tools that show a project as it renders", () => {
  it("are the two that render and the one that explains, and change nothing", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(["render_assembly", "compose_page", "explain"]);
    // Each of the two that render takes what a visitor arrives with.
    for (const tool of tools.slice(0, 2)) {
      expect(Object.keys(tool.inputSchema.properties ?? {}), tool.name).toEqual(
        expect.arrayContaining(["params", "query"]),
      );
      expect(tool.inputSchema.required, tool.name).toHaveLength(1);
    }
  });

  it("render an assembly, and compose a page, for the visitor a call describes", async () => {
    file("src/assemblies/asked/asked.html", "<p>on disk</p>");
    file("src/pages/product/product.html", '<main><assembly name="asked"></assembly></main>');
    file("src/pages/product/product.page.ts", 'export default { route: "/p/:sku" };');
    dev.runningFor(dir);
    const arrived = { params: { sku: "kb-250" }, query: { grind: "espresso" } };
    const rendered = await call("render_assembly", { name: "asked", ...arrived });
    expect(rendered.ok).toBe(true);
    expect((rendered.result as { data: unknown }).data).toEqual(arrived);
    const composed = await call("compose_page", { page: "product", ...arrived });
    expect(composed.ok).toBe(true);
    expect((composed.result as { html: string }).html).toContain('"params":{"sku":"kb-250"}');
  });

  it("say a parameter of the route the call left out, having composed the page without it", async () => {
    file("src/assemblies/header/header.html", "<h1>Shop</h1>");
    file("src/pages/product/product.html", '<main><assembly name="header"></assembly></main>');
    file("src/pages/product/product.page.ts", 'export default { route: "/p/:sku" };');
    const composed = await call("compose_page", { page: "product" });
    expect(composed.ok).toBe(false);
    expect(composed.problems).toEqual([expect.stringContaining("no value for sku")]);
    expect((composed.result as { html: string }).html).toContain("<h1>Shop</h1>");
  });

  it("explain a rule by its id, and list the ids for one that is not a rule", async () => {
    expect((await call("explain", { id: "directory-is-an-assembly" })).ok).toBe(true);
    const unknown = await call("explain", { id: "no-such-rule" });
    expect(unknown.ok).toBe(false);
    expect(unknown.problems[0]).toMatch(/there is no rule "no-such-rule"\. The ids are: /);
  });
});
