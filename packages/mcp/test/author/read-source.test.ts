// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { readSource, resolveRoot } from "@asmjs/mcp";

let dir = "";
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "read-source-"));
  mkdirSync(join(dir, "src"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

it("returns actual UTF-8 source without executing it", () => {
  const contents = 'throw new Error("not executed");\n// Café 茶\n';
  writeFileSync(join(dir, "src/view.ts"), contents);
  expect(readSource(resolveRoot(dir), "src/view.ts")).toEqual({
    ok: true,
    result: { path: "src/view.ts", contents },
    problems: [],
  });
});

it("refuses missing, oversized and invalid UTF-8 sources", () => {
  writeFileSync(join(dir, "src/large.ts"), "x".repeat(65537));
  writeFileSync(join(dir, "src/binary.ts"), Buffer.from([255, 254]));
  expect(readSource(resolveRoot(dir), "src/missing.ts")).toMatchObject({
    ok: false,
    result: { path: "src/missing.ts", missing: true },
  });
  for (const path of ["src/large.ts", "src/binary.ts", "package.json"]) {
    const result = readSource(resolveRoot(dir), path);
    expect(result.ok).toBe(false);
    expect(result.result).toBeNull();
    expect(result.problems.length).toBeGreaterThan(0);
  }
});
