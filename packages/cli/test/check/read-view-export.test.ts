// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readViewExport } from "@assemblejs/cli";

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
    expect(readViewExport(view, "shadow")).toBe(true);
    expect(readViewExport(view, "mount")).toBe("visible");
  });

  it("is undefined for a name it does not export, a view with no module, or no file", () => {
    expect(readViewExport(file("card.react.tsx", "export default () => null;"), "shadow")).toBe(
      undefined,
    );
    expect(readViewExport(file("card.html", "<p>card</p>"), "shadow")).toBeUndefined();
    expect(readViewExport("/nowhere/card.react.tsx", "shadow")).toBeUndefined();
  });
});
