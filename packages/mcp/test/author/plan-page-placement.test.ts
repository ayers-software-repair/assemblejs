// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { planPagePlacement, resolveRoot } from "@asmjs/mcp";

const project = (template: string) => {
  const path = mkdtempSync(join(tmpdir(), "page-plan-"));
  mkdirSync(join(path, "src/pages/product"), { recursive: true });
  const file = join(path, "src/pages/product/product.html");
  writeFileSync(file, template);
  return { root: resolveRoot(path), file };
};

describe("a read-only page placement plan through the shared CLI parser", () => {
  it("keeps manual markup and other placements with exact expected-base text", () => {
    const before =
      '<body>\n  <p>My shop introduction.</p>\n  <assembly name="buy-box"></assembly>\n  <assembly name="lesson-note"></assembly>\n</body>';
    const f = project(before);
    const answer = planPagePlacement(f.root, "product", "price-calculator", { after: "buy-box" });
    expect(answer).toEqual({
      ok: true,
      problems: [],
      result: {
        placed: 1,
        change: {
          path: "src/pages/product/product.html",
          before,
          after: before.replace(
            '<assembly name="buy-box"></assembly>',
            '<assembly name="buy-box"></assembly>\n  <assembly name="price-calculator"></assembly>',
          ),
        },
      },
    });
    expect(readFileSync(f.file, "utf8")).toBe(before);
  });

  it.each([
    '<!--\n          <assembly name="buy-box"></assembly>\n-->\n',
    "<script>const sample = '<assembly name=\"buy-box\"></assembly>';</script>",
  ])("does not use an inert anchor: %s", (before) => {
    const f = project(before);
    expect(planPagePlacement(f.root, "product", "price-calculator", { after: "buy-box" }).ok).toBe(
      false,
    );
    expect(readFileSync(f.file, "utf8")).toBe(before);
  });

  it("ignores an inert copy beside one live anchor and retains CRLF and indentation", () => {
    const before =
      '<body>\r\n<!-- <assembly name="buy-box"></assembly> -->\r\n\t<assembly name="buy-box"></assembly>\r\n</body>';
    const f = project(before);
    expect(
      planPagePlacement(f.root, "product", "price-calculator", { after: "buy-box" }),
    ).toMatchObject({
      ok: true,
      result: {
        change: {
          before,
          after: before.replace(
            '\t<assembly name="buy-box"></assembly>',
            '\t<assembly name="buy-box"></assembly>\r\n\t<assembly name="price-calculator"></assembly>',
          ),
        },
      },
    });
    expect(readFileSync(f.file, "utf8")).toBe(before);
  });

  it("refuses an ambiguous live neighbour instead of choosing one", () => {
    const before = '<assembly name="buy-box"></assembly>\n<assembly name="buy-box"></assembly>';
    const f = project(before);
    expect(
      planPagePlacement(f.root, "product", "price-calculator", { before: "buy-box" }),
    ).toMatchObject({ ok: false, result: null });
    expect(readFileSync(f.file, "utf8")).toBe(before);
  });

  it("can plan start/end and reports existing placements without creating an assembly", () => {
    const f = project('<body><assembly name="price-calculator"></assembly></body>');
    for (const at of ["start", "end"] as const)
      expect(planPagePlacement(f.root, "product", "price-calculator", { at })).toMatchObject({
        ok: true,
        result: { placed: 2 },
      });
    expect(readFileSync(f.file, "utf8")).toBe(
      '<body><assembly name="price-calculator"></assembly></body>',
    );
  });

  it("refuses invalid names, absent pages, malformed placements and oversized output", () => {
    const f = project('<assembly name="buy-box" unexpected="yes"></assembly>');
    expect(planPagePlacement(f.root, "../product", "price-calculator", { at: "end" }).ok).toBe(
      false,
    );
    expect(planPagePlacement(f.root, "product", 'bad"name', { at: "end" }).ok).toBe(false);
    expect(planPagePlacement(f.root, "missing", "price-calculator", { at: "end" }).ok).toBe(false);
    expect(planPagePlacement(f.root, "product", "price-calculator", { after: "buy-box" }).ok).toBe(
      false,
    );
    writeFileSync(f.file, "x".repeat(65536));
    expect(planPagePlacement(f.root, "product", "price-calculator", { at: "end" }).ok).toBe(false);
    expect(readFileSync(f.file, "utf8")).toBe("x".repeat(65536));
    writeFileSync(f.file, Buffer.from([255]));
    expect(planPagePlacement(f.root, "product", "price-calculator", { at: "end" }).ok).toBe(false);
  });

  it("refuses a linked page without disclosing the external contents", () => {
    const f = project("before");
    const outside = mkdtempSync(join(tmpdir(), "outside-page-plan-"));
    writeFileSync(join(outside, "private.html"), "outside data must stay outside");
    const page = "linked";
    mkdirSync(join(f.root.path, "src/pages", page));
    symlinkSync(
      join(outside, "private.html"),
      join(f.root.path, "src/pages", page, page + ".html"),
    );
    const answer = planPagePlacement(f.root, page, "price-calculator", { at: "end" });
    expect(answer.ok).toBe(false);
    expect(JSON.stringify(answer)).not.toContain("outside data");
  });
});
