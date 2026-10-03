// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { carryReferences, realIo } from "@assemblejs/cli";

describe("carrying the files a stylesheet names into the build", () => {
  it("copies each one, named by its content, and points the sheet at where it is served", () => {
    const root = mkdtempSync(join(tmpdir(), "carry-"));
    writeFileSync(join(root, "bg.png"), "pixels");
    const css = carryReferences(
      ".a { background: url(./bg.png) no-repeat } .b { mask: url('bg.png#m') } .c { background: url(/x.png) }",
      join(root, "cart.css"),
      root,
      realIo,
    );
    const served =
      /\/_assemblejs\/assets\/styles\/files\/(bg-[0-9a-f]{8}\.png)/.exec(css)?.[1] ?? "";
    expect(readFileSync(join(root, "dist", "client", "styles", "files", served), "utf8")).toBe(
      "pixels",
    );
    expect(css).toContain(`url(/_assemblejs/assets/styles/files/${served}) no-repeat`);
    expect(css).toContain(`url('/_assemblejs/assets/styles/files/${served}#m')`);
    expect(css).toContain("url(/x.png)");
  });
});
