// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { readViewExport } from "@assemblejs/cli";
import { linkedProject } from "../fixtures/linked-project.js";

const file = (name: string, source: string): string => {
  const path = join(mkdtempSync(join(tmpdir(), "view-export-")), name);
  writeFileSync(path, source);
  return path;
};

describe("what a framework view exports for the registry to read", () => {
  it("is the literal it writes under the name, read and never run", () => {
    const view = file(
      "card.react.tsx",
      'export const shadow = true;\nexport const mount = "visible";\nexport default () => <p>card</p>;',
    );
    expect(readViewExport(dirname(view), view, "shadow")).toBe(true);
    expect(readViewExport(dirname(view), view, "mount")).toBe("visible");
  });

  it("is undefined for a name it does not export, a view with no module, or no file", () => {
    const plain = file("card.react.tsx", "export default () => null;");
    expect(readViewExport(dirname(plain), plain, "shadow")).toBeUndefined();
    const html = file("card.html", "<p>card</p>");
    expect(readViewExport(dirname(html), html, "shadow")).toBeUndefined();
    expect(readViewExport("/nowhere", "/nowhere/card.react.tsx", "shadow")).toBeUndefined();
  });

  it("is undefined for a view that leads out of the project, which is not opened", () => {
    const { root, outside } = linkedProject(
      {},
      { "src/assemblies/card/card.lit.ts": "outside:shadowed.lit.ts" },
    );
    const view = join(root, "src/assemblies/card/card.lit.ts");
    expect(readViewExport(root, view, "shadow")).toBeUndefined();
    expect(readViewExport(root, view, "mount")).toBeUndefined();
    // The same file, asked of a root it is inside, is read: the root is what refused it.
    expect(readViewExport(outside, join(outside, "shadowed.lit.ts"), "shadow")).toBe(true);
  });
});
