// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addAssembly, resolveRoot } from "@assemblejs/mcp";

describe("adding an assembly through the agent surface", () => {
  it("writes the files and answers with the tag that places it", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-add-"));
    const answer = addAssembly(resolveRoot(dir), "cart", "svelte");
    expect(answer).toMatchObject({
      ok: true,
      result: {
        written: ["src/assemblies/cart/cart.svelte"],
        tag: '<assembly name="cart"></assembly>',
      },
    });
    expect(existsSync(join(dir, "src", "assemblies", "cart", "cart.svelte"))).toBe(true);
    expect(answer.next?.join()).toContain("place_assembly");
  });

  it("refuses with the fix, and writes nothing", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-add-"));
    const answer = addAssembly(resolveRoot(dir), "Cart", "html");
    expect(answer.problems[0]).toMatchObject({ fix: 'call it "cart"' });
    expect(existsSync(join(dir, "src"))).toBe(false);
  });

  it("refuses an assembly that exists", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-add-"));
    addAssembly(resolveRoot(dir), "cart", "html");
    expect(addAssembly(resolveRoot(dir), "cart", "html").ok).toBe(false);
  });
});
