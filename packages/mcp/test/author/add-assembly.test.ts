// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
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

  it("refuses a name that would leave the assemblies directory with its fix, never a throw", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-add-"));
    for (const name of ["../../../x", "/etc", "a/b"]) {
      const answer = addAssembly(resolveRoot(dir), name, "html");
      expect(answer.ok).toBe(false);
      expect(answer.problems[0]).toMatchObject({ rule: "directory-is-an-assembly" });
    }
  });

  it("refuses, with its rule, where a link to nothing already holds the assembly's name", () => {
    const dir = mkdtempSync(join(tmpdir(), "mcp-add-"));
    mkdirSync(join(dir, "src", "assemblies"), { recursive: true });
    symlinkSync(join(dir, "nowhere"), join(dir, "src", "assemblies", "evil"));
    expect(addAssembly(resolveRoot(dir), "evil", "html").ok).toBe(false);
  });
});
