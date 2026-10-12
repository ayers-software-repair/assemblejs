// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProject, missingAssemblyFix } from "@assemblejs/cli";

describe("what to do about a placement that names no assembly", () => {
  it("is to add it, or to place one of those that exist", () => {
    const root = mkdtempSync(join(tmpdir(), "fix-"));
    expect(missingAssemblyFix(root, "cart", [])).toBe("add it: assemblejs add assembly cart");
    expect(missingAssemblyFix(root, "cart", ["hello", "price"])).toBe(
      "add it, or place one that exists: hello, price",
    );
  });

  // Told to add an assembly whose directory is there, and `add` refusing the name as taken, a
  // person or an agent went round between the two.
  it("is to mend its directory, where one of that name is there and is not an assembly", () => {
    const root = mkdtempSync(join(tmpdir(), "fix-"));
    mkdirSync(join(root, "src", "assemblies", "cart"), { recursive: true });
    expect(missingAssemblyFix(root, "cart", ["hello"])).toBe(
      "src/assemblies/cart is there and is not an assembly yet: mend what is said of that directory",
    );
  });

  it("through check: a page placing an assembly with two views is told to mend it, not to add it", async () => {
    const root = mkdtempSync(join(tmpdir(), "fix-"));
    const file = (path: string, contents: string): void => {
      mkdirSync(join(root, path, ".."), { recursive: true });
      writeFileSync(join(root, path), contents);
    };
    file("package.json", "{}");
    file("src/assemblies/cart/cart.html", "<p>cart</p>");
    file("src/assemblies/cart/cart.svelte", "<p>cart</p>");
    file("src/pages/home/home.html", '<html><body><assembly name="cart"></assembly></body></html>');
    const fixes = (await checkProject(root))
      .filter((problem) => problem.rule === "a-placement-names-an-assembly")
      .map((problem) => problem.fix);
    expect(fixes).toEqual([
      "src/assemblies/cart is there and is not an assembly yet: mend what is said of that directory",
    ]);
  });
});
