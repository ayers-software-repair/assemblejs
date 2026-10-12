// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { insideRoot } from "@assemblejs/build";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";
import { answering, createMcpServer, resolveRoot } from "@assemblejs/mcp";
import type { ToolResult } from "@assemblejs/mcp";

const said = async (tool: () => ToolResult | Promise<ToolResult>): Promise<ToolResult> => {
  const { content } = await answering(tool)(undefined);
  expect(content).toHaveLength(1);
  expect(content[0].type).toBe("text");
  return JSON.parse(content[0].text) as ToolResult;
};

describe("a tool as the protocol calls it", () => {
  it("answers what the tool answers, now or later, as one block of JSON", async () => {
    const answer: ToolResult = { ok: true, result: { written: ["a"] }, problems: [], next: ["b"] };
    expect(await said(() => answer)).toEqual(answer);
    expect(await said(() => Promise.resolve(answer))).toEqual(answer);
  });

  it("answers a path that leads out of the project with its rule and its fix", async () => {
    const root = mkdtempSync(join(tmpdir(), "answering-"));
    symlinkSync(mkdtempSync(join(tmpdir(), "outside-")), join(root, "src"));
    expect(
      await said(() => ({ ok: true, result: insideRoot(root, "src", "a"), problems: [] })),
    ).toEqual({
      ok: false,
      result: null,
      problems: [
        {
          path: join(root, "src", "a"),
          rule: "a-project-stays-inside-its-root",
          message: "a leads out of the project, and nothing outside the project is read",
          fix: "put the file or directory itself where the link is, or bring what it leads to in as a package",
        },
      ],
    });
  });

  it("answers a link that leads nowhere as one, and a path that climbs out by its own sentence", async () => {
    const root = mkdtempSync(join(tmpdir(), "answering-"));
    symlinkSync(join(root, "no-such"), join(root, "dead"));
    const dead = await said(() => ({ ok: true, result: insideRoot(root, "dead"), problems: [] }));
    expect(dead.problems).toEqual([
      expect.objectContaining({
        rule: "a-project-stays-inside-its-root",
        message: "dead is a link that leads nowhere, and nothing is read through it",
      }),
    ]);
    const climbed = await said(() => ({
      ok: true,
      result: insideRoot(root, "..", "elsewhere"),
      problems: [],
    }));
    expect(climbed.ok).toBe(false);
    expect(climbed.problems).toHaveLength(1);
  });

  it("answers what the system refused of a read or a write in a sentence", async () => {
    const root = mkdtempSync(join(tmpdir(), "answering-"));
    mkdirSync(join(root, "a-directory"));
    const answer = await said(() => ({
      ok: true,
      result: readFileSync(join(root, "a-directory"), "utf8"),
      problems: [],
    }));
    expect(answer.ok).toBe(false);
    expect(answer.problems).toEqual([expect.stringMatching(/^the system refused it: EISDIR/)]);
  });

  // A fault is not a refusal: answered as one, it would read as something the agent did.
  it("throws on anything else, which the protocol reports as the error it is", async () => {
    await expect(
      answering(() => {
        throw new TypeError("a fault of this server's own");
      })(undefined),
    ).rejects.toThrow("a fault of this server's own");
  });
});

// The same, asked as an agent asks: through the whole server, over the protocol.
describe("what an agent is told when a tool is refused", () => {
  const clients: Client[] = [];
  afterEach(async () => {
    for (const client of clients.splice(0)) await client.close();
  });
  /** A project's root with its assemblies directory, and a way to call a tool of its server. */
  const project = async () => {
    const dir = mkdtempSync(join(tmpdir(), "answering-server-"));
    mkdirSync(join(dir, "src", "assemblies", "cart"), { recursive: true });
    writeFileSync(join(dir, "src", "assemblies", "cart", "cart.html"), "<p>Two items</p>");
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "an-agent", version: "1.0.0" });
    clients.push(client);
    await createMcpServer(resolveRoot(dir)).connect(serverSide);
    await client.connect(clientSide);
    const call = async (name: string, given: Record<string, unknown>): Promise<ToolResult> => {
      const { content } = await client.callTool({ name, arguments: given });
      return JSON.parse((content as Array<{ text: string }>)[0]?.text ?? "") as ToolResult;
    };
    return { dir, call };
  };

  // The protocol carries a thrown error as a line of prose marked an error. A refusal is an
  // answer like any other: its rule and its fix, for an agent to act on.
  it("is the rule and the fix where a path leads out of the project, not the error's text", async () => {
    const { dir, call } = await project();
    const outside = mkdtempSync(join(tmpdir(), "answering-outside-"));
    rmSync(join(dir, "src", "assemblies"), { recursive: true });
    symlinkSync(outside, join(dir, "src", "assemblies"));
    const answer = await call("add_assembly", { name: "nav" });
    expect(answer.ok).toBe(false);
    expect(answer.problems).toEqual([
      expect.objectContaining({
        rule: "a-project-stays-inside-its-root",
        message: "nav leads out of the project, and nothing outside the project is read",
      }),
    ]);
    expect(readdirSync(outside)).toEqual([]);
  });

  it("is a sentence where the system refuses a read or a write", async () => {
    const { dir, call } = await project();
    // A directory where the page's template goes.
    mkdirSync(join(dir, "src", "pages", "home", "home.html"), { recursive: true });
    const answer = await call("place_assembly", { page: "home", name: "cart" });
    expect(answer.ok).toBe(false);
    expect(answer.problems).toEqual([expect.stringMatching(/^the system refused it: EISDIR/)]);
  });

  it("renders without a dev server where the record of one leads out of the project", async () => {
    const { dir, call } = await project();
    const outside = mkdtempSync(join(tmpdir(), "answering-outside-"));
    writeFileSync(join(outside, "dev.json"), '{"url":"http://127.0.0.1:1"}');
    mkdirSync(join(dir, ".assemblejs"));
    symlinkSync(join(outside, "dev.json"), join(dir, ".assemblejs", "dev.json"));
    const answer = await call("render_assembly", { name: "cart" });
    expect(answer.ok).toBe(true);
    expect(JSON.stringify(answer.result)).toContain("Two items");
  });
});
