// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { applySourceChanges, resolveRoot } from "@asmjs/mcp";

vi.mock("node:fs", async (original) => ({ ...(await original<typeof fs>()) }));
let dir = "";
beforeEach(() => {
  dir = fs.mkdtempSync(join(tmpdir(), "apply-source-"));
  fs.mkdirSync(join(dir, "src"));
});
afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(dir, { recursive: true, force: true });
});

it("writes exact additions and replacements from one validated batch", () => {
  fs.writeFileSync(join(dir, "src/page.html"), "<main></main>\n");
  const changes = [
    { path: "src/assemblies/quote/quote.tsx", before: null, after: "export default 1;\n" },
    {
      path: "src/page.html",
      before: "<main></main>\n",
      after: '<main><assembly name="quote"></assembly></main>\n',
    },
  ];
  expect(applySourceChanges(resolveRoot(dir), changes)).toMatchObject({
    ok: true,
    result: { written: changes.map((change) => change.path) },
    problems: [],
  });
  for (const change of changes)
    expect(fs.readFileSync(join(dir, change.path), "utf8")).toBe(change.after);
});

it("validates every base before writing any earlier addition", () => {
  fs.writeFileSync(join(dir, "src/page.html"), "outside edit");
  const result = applySourceChanges(resolveRoot(dir), [
    { path: "src/new.ts", before: null, after: "new" },
    { path: "src/page.html", before: "reviewed", after: "changed" },
  ]);
  expect(result).toMatchObject({ ok: false, result: { written: [], attempted: [] } });
  expect(fs.existsSync(join(dir, "src/new.ts"))).toBe(false);
  expect(fs.readFileSync(join(dir, "src/page.html"), "utf8")).toBe("outside edit");
});

it("refuses occupied additions, duplicate paths and ancestor-file collisions before writing", () => {
  fs.writeFileSync(join(dir, "src/taken.ts"), "outside");
  const add = (path: string) => ({ path, before: null, after: "new" });
  for (const changes of [
    [add("src/taken.ts")],
    [add("src/new.ts"), add("src/new.ts")],
    [add("src/new.ts"), add("src/new.ts/child.ts")],
  ]) {
    expect(applySourceChanges(resolveRoot(dir), changes)).toMatchObject({
      ok: false,
      result: { written: [], attempted: [] },
    });
  }
  expect(fs.existsSync(join(dir, "src/new.ts"))).toBe(false);
  expect(fs.readFileSync(join(dir, "src/taken.ts"), "utf8")).toBe("outside");
});

it("refuses non-UTF-8 actual bytes even if a lossy decode would match the proposed base", () => {
  fs.writeFileSync(join(dir, "src/view.ts"), Buffer.from([255]));
  expect(
    applySourceChanges(resolveRoot(dir), [{ path: "src/view.ts", before: "\uFFFD", after: "new" }])
      .ok,
  ).toBe(false);
  expect(fs.readFileSync(join(dir, "src/view.ts"))).toEqual(Buffer.from([255]));
});

it("bounds batch count, individual/total bytes and unpaired surrogate values", () => {
  const root = resolveRoot(dir);
  const change = { path: "src/a.ts", before: null, after: "new" };
  for (const changes of [
    [],
    Array.from({ length: 33 }, (_, index) => ({ ...change, path: `src/a${index}.ts` })),
    [{ ...change, after: "x".repeat(65537) }],
    [{ ...change, after: "\uD800" }],
    Array.from({ length: 3 }, (_, index) => ({
      ...change,
      path: `src/a${index}.ts`,
      after: "x".repeat(65536),
    })),
  ])
    expect(applySourceChanges(root, changes)).toMatchObject({
      ok: false,
      result: { written: [], attempted: [] },
    });
  expect(fs.readdirSync(join(dir, "src"))).toEqual([]);
});

it("reports partial attempted additions without pretending the batch rolled back", () => {
  const write = fs.writeFileSync;
  let calls = 0;
  vi.spyOn(fs, "writeFileSync").mockImplementation((...args) => {
    if (++calls === 2) {
      const descriptor = args[0];
      if (typeof descriptor !== "number") throw new Error("expected a claimed descriptor");
      fs.writeSync(descriptor, "partial");
      throw new Error("disk full");
    }
    write(...args);
  });
  expect(
    applySourceChanges(resolveRoot(dir), [
      { path: "src/a.ts", before: null, after: "complete" },
      { path: "src/b.ts", before: null, after: "unfinished" },
    ]),
  ).toMatchObject({
    ok: false,
    result: { written: ["src/a.ts"], attempted: ["src/a.ts", "src/b.ts"] },
  });
  expect(fs.readFileSync(join(dir, "src/a.ts"), "utf8")).toBe("complete");
  expect(fs.readFileSync(join(dir, "src/b.ts"), "utf8")).toBe("partial");
});
