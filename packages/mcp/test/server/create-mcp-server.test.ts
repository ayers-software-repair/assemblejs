// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENT_SERVER, agentInstructions } from "@assemblejs/cli";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMcpServer, resolveRoot } from "@assemblejs/mcp";

let dir = "";
let client: Client;

const ownManifest = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as {
  name: string;
  version: string;
  bin: Record<string, string>;
  dependencies: Record<string, string>;
};
const ownManifestVersion = ownManifest.version;

describe("who an agent is talking to", () => {
  it("announces the version of the package that carries it", () => {
    expect(client.getServerVersion()).toEqual({ name: "assemblejs", version: ownManifestVersion });
  });

  // The build flattens src/<dir>/ into dist/; the version is read by walking up from the module,
  // so the built package must answer the same as the source tree, through a real client.
  it("announces the same version from the built package", () => {
    const root = fileURLToPath(new URL("../..", import.meta.url));
    const dist = fileURLToPath(new URL("../../dist/index.js", import.meta.url));
    const script = `import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer, resolveRoot } from ${JSON.stringify(dist)};
const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
const probe = new Client({ name: "probe", version: "0.0.0" });
await Promise.all([createMcpServer(resolveRoot(process.cwd())).connect(serverSide), probe.connect(clientSide)]);
console.log(JSON.stringify(probe.getServerVersion()));
await probe.close();`;
    const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: root,
      encoding: "utf8",
    });
    expect(JSON.parse(out)).toEqual({ name: "assemblejs", version: ownManifestVersion });
  });
});

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

  it("places a child in a parent's view, and sees the parent with the child composed inside", async () => {
    assembly("shell", "shell.html", "<section><h2>Shell</h2></section>");
    assembly("cart", "cart.html", "<p>Two items</p>");

    const placed = await call("place_assembly", { in: "shell", name: "cart" });
    expect(placed.ok).toBe(true);
    expect(placed.result["written"]).toEqual(["src/assemblies/shell/shell.html"]);

    const seen = await call("render_assembly", { name: "shell" });
    expect(seen.ok).toBe(true);
    expect(String(seen.result["html"])).toMatch(/data-name="shell".*data-name="cart".*Two items/s);
    expect(seen.result["children"]).toMatchObject([{ name: "cart", source: "local" }]);
    // Named neither, or both: where it goes is one or the other.
    expect((await call("place_assembly", { name: "cart" })).ok).toBe(false);
    expect((await call("place_assembly", { page: "home", in: "shell", name: "cart" })).ok).toBe(
      false,
    );
  });

  it("refuses a framework view with the reason rather than approximating it", async () => {
    assembly("counter", "counter.react.tsx", "export default () => null;");
    const answer = await call("render_assembly", { name: "counter" });
    expect(answer.ok).toBe(false);
    expect(answer.problems.join()).toContain("only its renderer turns into markup");
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

// A new project's AGENTS.md and registrations are written by the command line, which cannot
// read this package: what they say of this server is held to it here.
describe("what a project's own files say of this server", () => {
  it("is the name it announces, and the entry point its package installs", () => {
    expect(client.getServerVersion()?.name).toBe(AGENT_SERVER.name);
    expect(ownManifest.name).toBe(AGENT_SERVER.package);
    // Published as one exact version, which is what check compares with the one installed.
    expect(ownManifest.dependencies[AGENT_SERVER.commandLine]).toBe("workspace:*");
    expect(
      Object.values(ownManifest.bin).map((file) => join("node_modules", ownManifest.name, file)),
    ).toEqual([join(AGENT_SERVER.path)]);
  });

  it("is every resource it has, and no other", async () => {
    const named = [...new Set(agentInstructions().match(/assemblejs:\/\/[a-z{}/-]+/g))].sort();
    const { resources } = await client.listResources();
    expect(named).toEqual(resources.map((resource) => resource.uri).sort());
  });

  it("is every tool it has but the one that makes a project, and no tool it has not", async () => {
    const tools = (await client.listTools()).tools.map((tool) => tool.name);
    const told = agentInstructions();
    for (const tool of tools.filter((name) => name !== "create_project")) {
      expect(told, tool).toContain(`\`${tool}\``);
    }
    const named = (told.match(/`[a-z]+(?:_[a-z]+)+`/g) ?? []).map((word) => word.slice(1, -1));
    expect(named.length).toBeGreaterThan(3);
    for (const tool of named) expect(tools, tool).toContain(tool);
  });
});

describe("the server a registration starts", () => {
  const bin = fileURLToPath(new URL("../../dist/bin.js", import.meta.url));
  // The root the started server says it works on, asked through the protocol over its pipes.
  const rootOf = async (args: string[], env: Record<string, string>, cwd: string) => {
    const started = new Client({ name: "test-agent", version: "1.0.0" });
    await started.connect(
      new StdioClientTransport({ command: process.execPath, args: [bin, ...args], env, cwd }),
    );
    try {
      const answer = await started.readResource({ uri: "assemblejs://project" });
      return realpathSync((JSON.parse(textOf(answer)) as { root: string }).root);
    } finally {
      await started.close();
    }
  };

  it("works on the root it is handed as its argument, wherever it is started", async () => {
    const elsewhere = mkdtempSync(join(tmpdir(), "elsewhere-"));
    expect(await rootOf([dir], { CLAUDE_PROJECT_DIR: elsewhere }, elsewhere)).toBe(
      realpathSync(dir),
    );
  });

  it("works on the root Claude Code names in its environment, wherever it is started", async () => {
    const elsewhere = mkdtempSync(join(tmpdir(), "elsewhere-"));
    expect(await rootOf([], { CLAUDE_PROJECT_DIR: dir }, elsewhere)).toBe(realpathSync(dir));
  });

  it("works where it is started when nothing names a root", async () => {
    expect(await rootOf([], {}, dir)).toBe(realpathSync(dir));
  });

  it("refuses a root that is no directory, on the stream a client shows its user", () => {
    const missing = join(dir, "not-here");
    const ended = spawnSync(process.execPath, [bin, missing], { encoding: "utf8", input: "" });
    expect(ended.status).toBe(2);
    expect(ended.stdout).toBe("");
    expect(ended.stderr).toContain(`assemblejs-mcp: ${missing} is not a directory.`);
  });
});
