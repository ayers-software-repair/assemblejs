// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ResourceListChangedNotificationSchema } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, expect, it } from "vitest";
import { createMcpServer, resolveRoot } from "@asmjs/mcp";

let dir = "";
let client: Client;
beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "mcp-source-tools-"));
  mkdirSync(join(dir, "src"));
  const [a, b] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: "source-client", version: "0.0.0" });
  await Promise.all([createMcpServer(resolveRoot(dir)).connect(b), client.connect(a)]);
});
afterEach(async () => {
  await client.close();
  rmSync(dir, { recursive: true, force: true });
});
const call = async (name: string, args: Record<string, unknown>) => {
  const answer = await client.callTool({ name, arguments: args });
  const [block] = answer.content as Array<{ type: string; text: string }>;
  if (answer.isError) throw new Error(block?.text ?? "protocol error");
  return JSON.parse(block?.text ?? "{}") as { ok: boolean; result: unknown; problems: unknown[] };
};

it("reads actual source and applies exact guarded edits through the existing protocol", async () => {
  writeFileSync(join(dir, "src/view.html"), "<p>Before</p>\n");
  expect((await client.listTools()).tools.map((tool) => tool.name)).toEqual(
    expect.arrayContaining([
      "read_source",
      "read_source_version",
      "plan_page_placement",
      "apply_source_changes",
    ]),
  );
  expect(await call("read_source", { path: "src/view.html" })).toEqual({
    ok: true,
    result: { path: "src/view.html", contents: "<p>Before</p>\n" },
    problems: [],
  });
  let notices = 0;
  client.setNotificationHandler(ResourceListChangedNotificationSchema, () => {
    notices++;
  });
  await client.listResources();
  expect(
    await call("apply_source_changes", {
      changes: [{ path: "src/view.html", before: "<p>Before</p>\n", after: "<p>After</p>\n" }],
    }),
  ).toMatchObject({ ok: true, result: { written: ["src/view.html"] } });
  await client.listResources();
  expect(readFileSync(join(dir, "src/view.html"), "utf8")).toBe("<p>After</p>\n");
  expect(notices).toBe(1);
});

it("refuses every stale base before any writes and rejects metadata without opening it", async () => {
  writeFileSync(join(dir, "src/view.html"), "manual work");
  writeFileSync(join(dir, "package.json"), '{"secret":"do-not-read"}');
  expect(
    await call("apply_source_changes", {
      changes: [
        { path: "src/new.ts", before: null, after: "new" },
        { path: "src/view.html", before: "old", after: "replace" },
      ],
    }),
  ).toMatchObject({ ok: false, result: { written: [], attempted: [] } });
  expect(existsSync(join(dir, "src/new.ts"))).toBe(false);
  expect(readFileSync(join(dir, "src/view.html"), "utf8")).toBe("manual work");
  const refused = await call("read_source", { path: "package.json" });
  expect(refused.ok).toBe(false);
  expect(JSON.stringify(refused)).not.toContain("do-not-read");
});

it("rejects malformed source payloads in the tool schema", async () => {
  const result = await client.callTool({
    name: "apply_source_changes",
    arguments: { changes: [{ path: "src/new.ts", before: null, after: 1 }] },
  });
  expect(result.isError).toBe(true);
  expect(existsSync(join(dir, "src/new.ts"))).toBe(false);
});

it("reads current source identity through the actual protocol without returning metadata", async () => {
  writeFileSync(join(dir, "package.json"), '{"name":"identity-not-contents"}');
  writeFileSync(join(dir, "src/view.html"), "before");
  const before = await call("read_source_version", {});
  expect(before).toEqual({
    ok: true,
    result: { version: expect.stringMatching(/^[a-f0-9]{12}$/) },
    problems: [],
  });
  expect(JSON.stringify(before)).not.toContain("identity-not-contents");
  writeFileSync(join(dir, "src/view.html"), "outside edit");
  expect(await call("read_source_version", {})).not.toEqual(before);
  expect(readFileSync(join(dir, "src/view.html"), "utf8")).toBe("outside edit");
});

it("plans a page edit through the real protocol without writes or notifications", async () => {
  mkdirSync(join(dir, "src/pages/product"), { recursive: true });
  const path = join(dir, "src/pages/product/product.html");
  const before = '<p>My introduction.</p>\n<assembly name="buy-box"></assembly>';
  writeFileSync(path, before);
  let notices = 0;
  client.setNotificationHandler(ResourceListChangedNotificationSchema, () => {
    notices++;
  });
  await client.listResources();
  expect(
    await call("plan_page_placement", {
      page: "product",
      name: "price-calculator",
      position: { after: "buy-box" },
    }),
  ).toMatchObject({
    ok: true,
    result: {
      placed: 1,
      change: {
        path: "src/pages/product/product.html",
        before,
        after: expect.stringContaining('name="price-calculator"'),
      },
    },
  });
  const malformed = await client.callTool({
    name: "plan_page_placement",
    arguments: {
      page: "product",
      name: "price-calculator",
      position: { after: "buy-box", before: "buy-box" },
    },
  });
  expect(malformed.isError).toBe(true);
  await client.listResources();
  expect(notices).toBe(0);
  expect(readFileSync(path, "utf8")).toBe(before);
});
