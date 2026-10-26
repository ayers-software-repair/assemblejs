// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { hasSharedSources } from "@asmjs/build";

const made: string[] = [];
afterAll(() => {
  for (const root of made) rmSync(root, { recursive: true, force: true });
});
const project = (files: readonly string[]): string => {
  const root = mkdtempSync(join(tmpdir(), "shared-"));
  made.push(root);
  for (const file of files) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), "");
  }
  return root;
};

describe("whether a project has TypeScript outside its assemblies and its server file", () => {
  it("is so for a page's declaration, an api, or a module in any directory of src", () => {
    expect(hasSharedSources(project(["src/pages/home/home.page.ts"]), [])).toBe(true);
    expect(hasSharedSources(project(["src/api/time.api.ts"]), [])).toBe(true);
    expect(hasSharedSources(project(["src/lib/deep/format.ts"]), [])).toBe(true);
    expect(hasSharedSources(project(["src/lib/button.tsx"]), [])).toBe(true);
  });

  it("is not so for the server file, the assemblies, markup, styles, or no src at all", () => {
    expect(
      hasSharedSources(
        project([
          "src/server.ts",
          "src/assemblies/cart/cart.react.tsx",
          "src/assemblies/cart/cart.service.ts",
          "src/pages/home/home.html",
          "src/tokens.css",
        ]),
        ["react"],
      ),
    ).toBe(false);
    expect(hasSharedSources(project(["package.json"]), [])).toBe(false);
  });

  it("does not count a file that names an owner of JSX, which is that owner's", () => {
    const named = project(["src/lib/row.preact.tsx"]);
    expect(hasSharedSources(named, ["preact", "react"])).toBe(false);
    // With no Preact project to hold it, the shared one does.
    expect(hasSharedSources(named, ["react"])).toBe(true);
  });
});
