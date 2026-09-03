// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { composePage, resolveRoot } from "@assemblejs/mcp";
import type { ProjectRoot } from "@assemblejs/mcp";

let root: ProjectRoot;
let dir = "";

const assembly = (name: string, file: string, contents: string): void => {
  const at = join(dir, "src", "assemblies", name);
  mkdirSync(at, { recursive: true });
  writeFileSync(join(at, file), contents);
};

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-"));
  mkdirSync(join(dir, "src", "assemblies"), { recursive: true });
  root = resolveRoot(dir);
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("composing a page for an agent", () => {
  it("returns the page an agent's template actually makes", async () => {
    assembly("header", "header.html", "<h1>Shop</h1>");
    assembly("cart", "cart.html", "<p>Two items</p>");

    const composed = await composePage(
      root,
      `<main><assembly name="header"/><assembly name="cart"/></main>`,
    );

    expect(composed.problems).toEqual([]);
    expect(composed.html).toContain("<h1>Shop</h1>");
    expect(composed.html).toContain("<p>Two items</p>");
    expect(composed.html.startsWith("<main>")).toBe(true);
    expect(composed.diagnostics.map((d) => d.name)).toEqual(["header", "cart"]);
  });

  // The half an agent cannot get from the html. A page whose placement fell back looks fine.
  it("says which placement fell back, which the markup alone does not", async () => {
    assembly("header", "header.html", "<h1>Shop</h1>");
    const composed = await composePage(
      root,
      `<main><assembly name="header"/><assembly name="missing"/></main>`,
      { missing: { name: "missing", view: "default", deadline: 3000, fallback: "<p>soon</p>" } },
    );

    expect(composed.html).toContain("<h1>Shop</h1>");
    expect(composed.html).toContain("<p>soon</p>");
    expect(composed.diagnostics[0]?.source).toBe("local");
    expect(composed.diagnostics[1]?.source).toBe("fallback");
    expect(composed.problems.join()).toContain("missing");
  });

  it("keeps the page standing when a placement cannot render", async () => {
    assembly("ok", "ok.html", "<p>fine</p>");
    assembly("counter", "counter.react.tsx", "export default () => null;");
    const composed = await composePage(
      root,
      `<main><assembly name="ok"/><assembly name="counter"/></main>`,
    );
    // One assembly that needs a build does not cost the agent the rest of the page.
    expect(composed.html).toContain("<p>fine</p>");
    expect(composed.problems.join()).toContain("compiled");
  });

  it("hands back a refused template as a problem, not as a thrown error", async () => {
    const composed = await composePage(root, `<main><assembly name="Cart"/></main>`);
    expect(composed.html).toBe("");
    // The agent's own mistake to fix, phrased so it can.
    expect(composed.problems.join()).toContain("usable url segment");
  });

  it("composes a page with no placements unchanged", async () => {
    const composed = await composePage(root, "<main><p>static</p></main>");
    expect(composed.html).toBe("<main><p>static</p></main>");
    expect(composed.diagnostics).toEqual([]);
  });
});
