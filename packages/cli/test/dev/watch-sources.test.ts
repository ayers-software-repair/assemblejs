// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { watchSources } from "@assemblejs/cli";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("watching sources", () => {
  it("calls back once for a burst of changes, and never after it stops", async () => {
    const root = mkdtempSync(join(tmpdir(), "watch-"));
    let calls = 0;
    const stop = watchSources(root, () => (calls += 1), 50);
    await wait(50);
    for (const name of ["a.ts", "b.ts", "c.ts"]) writeFileSync(join(root, name), name);
    await wait(300);
    expect(calls).toBe(1);
    stop();
    writeFileSync(join(root, "d.ts"), "d");
    await wait(300);
    expect(calls).toBe(1);
  });
});
