// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ResourceListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMcpServer, resolveRoot } from "@asmjs/mcp";

vi.mock("node:fs", async (importOriginal) => ({
  ...(await importOriginal<typeof fs>()),
}));

let dir = "";
let client: Client;
const call = async (name: string, args: Record<string, unknown>) => {
  const answer = await client.callTool({ name, arguments: args });
  const [first] = answer.content as Array<{ text: string }>;
  if (answer.isError) throw new Error(first?.text ?? "protocol error");
  return JSON.parse(first?.text ?? "{}") as {
    ok: boolean;
    result: { id: string; changes: Array<{ path: string; before: null; after: string }> } | null;
    problems: unknown[];
  };
};
beforeEach(async () => {
  dir = fs.mkdtempSync(join(tmpdir(), "mcp-review-"));
  const [a, b] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "review-client", version: "1.0.0" });
  await Promise.all([createMcpServer(resolveRoot(dir)).connect(b), client.connect(a)]);
});
afterEach(async () => {
  vi.restoreAllMocks();
  await client.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("reviewable assembly creation through the agent protocol", () => {
  it.each(["apply_assembly_plan", "add_assembly"])(
    "refreshes resources after %s leaves a partial assembly",
    async (tool) => {
      let notices = 0;
      client.setNotificationHandler(ResourceListChangedNotificationSchema, () => {
        notices += 1;
      });
      expect(
        (await client.listResources()).resources.map((resource) => resource.uri),
      ).not.toContain("assemblejs://assembly/cart");
      const plan = await call("plan_assembly", { name: "cart", renderer: "html" });
      expect(plan.ok).toBe(true);
      const write = fs.writeFileSync;
      vi.spyOn(fs, "writeFileSync").mockImplementation((path) => {
        write(path, "<p>partial", { flag: "wx" });
        throw new Error("disk full after partial write");
      });
      const args =
        tool === "add_assembly" ? { name: "cart", renderer: "html" } : { id: plan.result?.id };
      const answer = await call(tool, args);
      expect(answer).toMatchObject({
        ok: false,
        result: { written: [], attempted: ["src/assemblies/cart/cart.html"] },
      });
      expect((await client.listResources()).resources.map((resource) => resource.uri)).toContain(
        "assemblejs://assembly/cart",
      );
      expect(notices).toBe(1);
    },
  );

  it("lists all three review tools without notifications for plans, discards or stale ids", async () => {
    const names = (await client.listTools()).tools.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining(["plan_assembly", "apply_assembly_plan", "discard_assembly_plan"]),
    );
    let notices = 0;
    client.setNotificationHandler(ResourceListChangedNotificationSchema, () => {
      notices += 1;
    });
    const discarded = await call("plan_assembly", { name: "cart" });
    await call("discard_assembly_plan", { id: discarded.result?.id });
    await call("apply_assembly_plan", { id: discarded.result?.id });
    await client.listResources();
    expect(notices).toBe(0);
    const applied = await call("plan_assembly", { name: "basket" });
    await call("apply_assembly_plan", { id: applied.result?.id });
    await client.listResources();
    expect(notices).toBe(1);
    await call("apply_assembly_plan", { id: applied.result?.id });
    await client.listResources();
    expect(notices).toBe(1);
  });

  it("plans, rejects, revises and applies exactly the reviewed files before real compose/check", async () => {
    await call("create_project", { name: "shop" });
    const first = await call("plan_assembly", { name: "cart", renderer: "html" });
    expect(first.ok).toBe(true);
    const rejected = first.result?.id ?? "missing";
    expect(fs.existsSync(join(dir, "src/assemblies/cart"))).toBe(false);
    expect((await call("discard_assembly_plan", { id: rejected })).ok).toBe(true);
    expect((await call("apply_assembly_plan", { id: rejected })).ok).toBe(false);
    expect(fs.existsSync(join(dir, "src/assemblies/cart"))).toBe(false);
    const revised = await call("plan_assembly", { name: "basket", renderer: "html" });
    expect(revised.ok).toBe(true);
    expect((await call("apply_assembly_plan", { id: revised.result?.id })).ok).toBe(true);
    for (const change of revised.result?.changes ?? []) {
      expect(change.before).toBeNull();
      expect(fs.readFileSync(join(dir, change.path), "utf8")).toBe(change.after);
    }
    expect((await call("apply_assembly_plan", { id: revised.result?.id })).ok).toBe(false);
    expect((await call("place_assembly", { page: "home", name: "basket" })).ok).toBe(true);
    expect((await call("compose_page", { page: "home" })).ok).toBe(true);
    expect((await call("check", {})).ok).toBe(true);
  });

  it("preserves an outside edit made after the proposal instead of treating approval as overwrite", async () => {
    const plan = await call("plan_assembly", { name: "cart", renderer: "html" });
    expect(plan.ok).toBe(true);
    fs.mkdirSync(join(dir, "src/assemblies/cart"), { recursive: true });
    const file = join(dir, "src/assemblies/cart/cart.html");
    fs.writeFileSync(file, "<p>Manual work</p>");
    expect((await call("apply_assembly_plan", { id: plan.result?.id })).ok).toBe(false);
    expect(fs.readFileSync(file, "utf8")).toBe("<p>Manual work</p>");
  });
});
