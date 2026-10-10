// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { COMPUTED, UNREAD } from "@assemblejs/cli";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { RESOURCE_NOT_FOUND, registerResources, resolveRoot } from "@assemblejs/mcp";

let dir = "";
let client: Client;

const file = (path: string, contents = ""): void => {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), contents);
};

const read = async (uri: string): Promise<unknown> => {
  const [first] = (await client.readResource({ uri })).contents;
  if (first === undefined || !("text" in first) || typeof first.text !== "string") {
    throw new Error(`${uri} answered no text`);
  }
  expect(first.uri).toBe(uri);
  expect(first.mimeType).toBe("application/json");
  return JSON.parse(first.text) as unknown;
};

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-resources-"));
  file("src/assemblies/cart/cart.html", "<p>cart</p>");
  file("src/assemblies/card/card.html", '<article><assembly name="cart"></assembly></article>');
  file("src/pages/home/home.html", '<main><assembly name="card"></assembly></main>');
  const server = new McpServer({ name: "bare", version: "0.0.0" });
  registerResources(server, resolveRoot(dir));
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "test-agent", version: "1.0.0" });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
});
afterEach(async () => {
  await client.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("what an agent reads", () => {
  it("lists the project, the rules, and each assembly as a resource of its own", async () => {
    const { resources } = await client.listResources();
    expect(resources.map(({ uri, name }) => [uri, name])).toEqual([
      ["assemblejs://project", "project"],
      ["assemblejs://rules", "rules"],
      ["assemblejs://assembly/card", "assembly/card"],
      ["assemblejs://assembly/cart", "assembly/cart"],
    ]);
    expect(resources.every((resource) => resource.mimeType === "application/json")).toBe(true);
  });

  it("says, where the project is listed, how what could not be read is marked", async () => {
    const { resources } = await client.listResources();
    const project = resources.find((resource) => resource.uri === "assemblejs://project");
    expect(project?.description).toContain(`reads "${COMPUTED}"`);
    expect(project?.description).toContain(`reads "${UNREAD}"`);
  });

  it("lists an assembly written since it was last asked, with nothing restarted", async () => {
    file("src/assemblies/price/price.html", "<p>price</p>");
    const uris = (await client.listResources()).resources.map((resource) => resource.uri);
    expect(uris).toContain("assemblejs://assembly/price");
  });

  it("offers one assembly by its name as a template, for a client that fills one in", async () => {
    const { resourceTemplates } = await client.listResourceTemplates();
    expect(resourceTemplates.map((template) => template.uriTemplate)).toEqual([
      "assemblejs://assembly/{name}",
    ]);
  });

  it("answers the whole project: its pages, its assemblies and how they are wired", async () => {
    expect(await read("assemblejs://project")).toMatchObject({
      pages: [{ name: "home", route: "/", places: [{ name: "card", view: "default" }] }],
      assemblies: [
        { name: "card", places: [{ name: "cart", view: "default" }], placedOn: ["home"] },
        { name: "cart", placedIn: ["card"] },
      ],
      apis: [],
    });
  });

  it("answers one assembly, with every placement of it", async () => {
    expect(await read("assemblejs://assembly/cart")).toMatchObject({
      name: "cart",
      view: "src/assemblies/cart/cart.html",
      placedOn: [],
      placedIn: [{ assembly: "card", view: "default" }],
    });
    expect(await read("assemblejs://assembly/card")).toMatchObject({
      placedOn: [{ page: "home", route: "/", view: "default", policy: {} }],
    });
  });

  it("answers an assembly the project has not with the protocol's own code for it", async () => {
    for (const uri of ["assemblejs://assembly/missing", "assemblejs://assembly/home"]) {
      await expect(client.readResource({ uri }), uri).rejects.toMatchObject({
        code: RESOURCE_NOT_FOUND,
        data: { uri },
      });
    }
  });

  it("completes an assembly's name from what the project has", async () => {
    const complete = async (value: string) =>
      (
        await client.complete({
          ref: { type: "ref/resource", uri: "assemblejs://assembly/{name}" },
          argument: { name: "name", value },
        })
      ).completion.values;
    expect(await complete("ca")).toEqual(["card", "cart"]);
    expect(await complete("cart")).toEqual(["cart"]);
    expect(await complete("x")).toEqual([]);
  });

  // Nothing outside the project is read, and nothing a project holds takes a read or the list
  // down: where a part of it leads out of the root, the rest is still listed and still told.
  it("still lists and answers when a part of the project leads out of it", async () => {
    const outside = mkdtempSync(join(tmpdir(), "assemblejs-mcp-outside-"));
    try {
      writeFileSync(
        join(outside, "config.ts"),
        'export default { contentSecurityPolicy: "SECRET" };',
      );
      symlinkSync(join(outside, "config.ts"), join(dir, "assemblejs.config.ts"));
      expect((await client.listResources()).resources.map((resource) => resource.uri)).toEqual([
        "assemblejs://project",
        "assemblejs://rules",
        "assemblejs://assembly/card",
        "assemblejs://assembly/cart",
      ]);
      const project = (await read("assemblejs://project")) as {
        settings: Record<string, unknown>;
        problems: { path: string; rule: string }[];
      };
      expect(project.settings["contentSecurityPolicy"]).toBe(UNREAD);
      expect(project.problems).toMatchObject([
        { path: "assemblejs.config.ts", rule: "a-project-stays-inside-its-root" },
      ]);
      expect(JSON.stringify(project)).not.toContain("SECRET");
      expect(await read("assemblejs://assembly/cart")).toMatchObject({ name: "cart" });
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("lists the fixed resources, and no assembly, where the assemblies lead out of the project", async () => {
    const outside = mkdtempSync(join(tmpdir(), "assemblejs-mcp-outside-"));
    try {
      mkdirSync(join(outside, "stray"));
      writeFileSync(join(outside, "stray", "stray.html"), "<p>not this project's</p>");
      rmSync(join(dir, "src", "assemblies"), { recursive: true });
      symlinkSync(outside, join(dir, "src", "assemblies"));
      expect((await client.listResources()).resources.map((resource) => resource.uri)).toEqual([
        "assemblejs://project",
        "assemblejs://rules",
      ]);
      expect(
        (
          await client.complete({
            ref: { type: "ref/resource", uri: "assemblejs://assembly/{name}" },
            argument: { name: "name", value: "" },
          })
        ).completion.values,
      ).toEqual([]);
      await expect(
        client.readResource({ uri: "assemblejs://assembly/stray" }),
      ).rejects.toMatchObject({ code: RESOURCE_NOT_FOUND });
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("answers the rules, each with its reason", async () => {
    const rules = (await read("assemblejs://rules")) as { id: string; because: string }[];
    expect(rules.length).toBeGreaterThan(5);
    expect(rules.every((rule) => rule.because.length > 40)).toBe(true);
  });
});
