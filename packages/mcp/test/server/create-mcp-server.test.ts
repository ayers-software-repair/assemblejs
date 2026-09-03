// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer, resolveRoot } from "@assemblejs/mcp";

let dir = "";
let client: Client;

const assembly = (name: string, file: string, contents: string): void => {
  const at = join(dir, "src", "assemblies", name);
  mkdirSync(at, { recursive: true });
  writeFileSync(join(at, file), contents);
};

/** A resource's contents are text OR blob; this narrows rather than asserting past the union. */
const textOf = (answer: { contents: readonly unknown[] }): string => {
  const first = answer.contents[0];
  if (typeof first !== "object" || first === null || !("text" in first)) return "";
  return typeof first.text === "string" ? first.text : "";
};

const call = async (name: string, args: Record<string, unknown>) => {
  const answer = await client.callTool({ name, arguments: args });
  const [first] = answer.content as Array<{ type: string; text: string }>;
  return JSON.parse(first?.text ?? "{}") as {
    ok: boolean;
    result: Record<string, unknown>;
    problems: string[];
    next?: string[];
  };
};

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-server-"));
  mkdirSync(join(dir, "src", "assemblies"), { recursive: true });
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

describe("what an agent can read", () => {
  it("gets the whole project in one read, rather than asking what exists", async () => {
    assembly("cart", "cart.html", "<p>Two items</p>");
    assembly("counter", "counter.react.tsx", "export default () => null;");

    const answer = await client.readResource({ uri: "assemblejs://project" });
    const project = JSON.parse(textOf(answer)) as {
      assemblies: Array<{ name: string; renderer: string }>;
      renderers: string[];
    };
    expect(project.assemblies.map((a) => a.name).sort()).toEqual(["cart", "counter"]);
    expect(project.renderers.sort()).toEqual(["html", "react"]);
  });

  it("gets the rules with their reasons, not just their sentences", async () => {
    const answer = await client.readResource({ uri: "assemblejs://rules" });
    const rules = JSON.parse(textOf(answer)) as Array<{
      id: string;
      because: string;
    }>;
    expect(rules.length).toBeGreaterThan(5);
    expect(rules.every((rule) => rule.because.length > 40)).toBe(true);
  });
});

describe("what an agent can do", () => {
  // The whole loop, through the protocol: write an assembly, see it render, put it on a page,
  // and see the page. No server started, no browser opened, nobody asked to look.
  it("renders an assembly it just wrote, and says what to do next", async () => {
    assembly("cart", "cart.html", "<p>Two items</p>");
    const answer = await call("render_assembly", { name: "cart" });

    expect(answer.ok).toBe(true);
    expect(String(answer.result["html"])).toContain("<p>Two items</p>");
    expect(String(answer.result["html"])).toContain("<assembly-root");
    expect(answer.next?.join()).toContain(`<assembly name="cart">`);
  });

  it("composes the page that template makes, with the account of each placement", async () => {
    assembly("header", "header.html", "<h1>Shop</h1>");
    assembly("cart", "cart.html", "<p>Two items</p>");

    const answer = await call("compose_page", {
      template: `<main><assembly name="header"/><assembly name="cart"/></main>`,
    });
    expect(answer.ok).toBe(true);
    const result = answer.result as { html: string; diagnostics: Array<{ name: string }> };
    expect(result.html).toContain("<h1>Shop</h1>");
    expect(result.html).toContain("<p>Two items</p>");
    expect(result.diagnostics.map((d) => d.name)).toEqual(["header", "cart"]);
  });

  it("refuses a framework view with the reason rather than approximating it", async () => {
    assembly("counter", "counter.react.tsx", "export default () => null;");
    const answer = await call("render_assembly", { name: "counter" });
    expect(answer.ok).toBe(false);
    expect(answer.problems.join()).toContain("has to be compiled");
  });

  it("names what exists when asked for something that does not", async () => {
    assembly("cart", "cart.html", "<p>x</p>");
    const answer = await call("render_assembly", { name: "checkout" });
    expect(answer.problems.join()).toContain("cart");
  });

  it("explains a rule, so an agent can decide rather than comply", async () => {
    const answer = await call("explain", { id: "no-default-credential" });
    expect(answer.ok).toBe(true);
    expect(String((answer.result as { because: string }).because)).toContain("password");
  });

  it("lists the rule ids when asked about one that does not exist", async () => {
    const answer = await call("explain", { id: "invented" });
    expect(answer.ok).toBe(false);
    expect(answer.problems.join()).toContain("one-framework-per-assembly");
  });
});

describe("what an agent cannot do", () => {
  it("has no tool that runs a shell, publishes or deploys", async () => {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);
    for (const forbidden of ["shell", "exec", "publish", "deploy", "install"]) {
      expect(names.some((name) => name.includes(forbidden))).toBe(false);
    }
  });

  it("answers every tool in a structure, never in prose", async () => {
    assembly("cart", "cart.html", "<p>x</p>");
    for (const [name, args] of [
      ["render_assembly", { name: "cart" }],
      ["compose_page", { template: "<main></main>" }],
      ["explain", { id: "directory-is-an-assembly" }],
    ] as const) {
      const answer = await call(name, args);
      // An agent that has to parse a sentence written for a person is an agent guessing.
      expect(typeof answer.ok).toBe("boolean");
      expect(Array.isArray(answer.problems)).toBe(true);
    }
  });
});
