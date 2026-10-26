// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { composeTemplate, resolveRoot } from "@asmjs/mcp";
import type { ProjectRoot } from "@asmjs/mcp";
import { devServer } from "../fixtures/dev-server.js";

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

const dev = devServer();

describe("composing through the project's dev server", () => {
  it("asks the running server for every placement, so the page is what the project serves", async () => {
    assembly("ok", "ok.html", "<p>on disk</p>");
    assembly("counter", "counter.react.tsx", "export default () => null;");
    dev.runningFor(dir);
    const composed = await composeTemplate(
      root,
      `<main><assembly name="ok"/><assembly name="counter"/></main>`,
    );
    expect(composed.problems).toEqual([]);
    expect(composed.html).toContain("served ok");
    expect(composed.html).toContain("served counter");
    expect(composed.diagnostics.map((d) => d.source)).toEqual(["remote", "remote"]);
  });

  it("says what failed or fell back on the running server, each with the id its log holds the cause against", async () => {
    assembly("failing", "failing.react.tsx", "export default () => null;");
    assembly("holder", "holder.react.tsx", "export default () => null;");
    dev.runningFor(dir);
    const composed = await composeTemplate(
      root,
      `<main><assembly name="failing"/><assembly name="holder"/></main>`,
    );
    // Each id is the server's own, and the one its log holds the failure against.
    const ids = composed.problems.map((said) => / against (\S+)$/.exec(said)?.[1] ?? "none");
    expect(dev.logged().map((line) => line.correlationId)).toEqual(expect.arrayContaining(ids));
    expect(composed.diagnostics.map((d) => [d.name, d.source, d.correlationId])).toEqual([
      ["failing", "fallback", ids[0]],
      ["holder", "remote", undefined],
    ]);
    expect(composed.problems).toEqual([
      `"failing" failed on the dev server, which answered 500: its log says why, against ${ids[0] ?? ""}`,
      `"price" fell back inside "holder" on the dev server: its log says why, against ${ids[1] ?? ""}`,
    ]);
    // The page's own fallback envelope carries the id the dev server logged the failure against.
    expect(composed.html).toContain(`data-failed="${ids[0] ?? ""}"`);
  });
});

describe("composing a template for an agent", () => {
  it("returns the page an agent's template actually makes", async () => {
    assembly("header", "header.html", "<h1>Shop</h1>");
    assembly("cart", "cart.html", "<p>Two items</p>");

    const composed = await composeTemplate(
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
    const composed = await composeTemplate(
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
    const composed = await composeTemplate(
      root,
      `<main><assembly name="ok"/><assembly name="counter"/></main>`,
    );
    // One assembly that needs a build does not cost the agent the rest of the page.
    expect(composed.html).toContain("<p>fine</p>");
    expect(composed.problems.join()).toContain("only its renderer turns into markup");
  });

  it("hands back a refused template as a problem, not as a thrown error", async () => {
    const composed = await composeTemplate(root, `<main><assembly name="Cart"/></main>`);
    expect(composed.html).toBe("");
    // The agent's own mistake to fix, phrased so it can.
    expect(composed.problems.join()).toContain("usable url segment");
  });

  it("composes a page with no placements unchanged", async () => {
    const composed = await composeTemplate(root, "<main><p>static</p></main>");
    expect(composed.html).toBe("<main><p>static</p></main>");
    expect(composed.diagnostics).toEqual([]);
  });

  it("composes what a placed assembly's own view places, and accounts for it beneath its parent", async () => {
    assembly("shell", "shell.html", '<section><assembly name="cart"></assembly></section>');
    assembly("cart", "cart.html", "<p>Two items</p>");
    const composed = await composeTemplate(root, '<main><assembly name="shell"/></main>');

    expect(composed.problems).toEqual([]);
    expect(composed.html).toMatch(/data-name="shell".*data-name="cart".*Two items/s);
    expect(composed.diagnostics).toMatchObject([
      { name: "shell", source: "local", children: [{ name: "cart", source: "local" }] },
    ]);
  });

  it("says why a child fell back, though the page and its parent stand", async () => {
    assembly("shell", "shell.html", '<section><assembly name="counter"></assembly></section>');
    assembly("counter", "counter.react.tsx", "export default () => null;");
    const composed = await composeTemplate(root, '<main><assembly name="shell"/></main>');

    expect(composed.diagnostics[0]).toMatchObject({ name: "shell", source: "local" });
    expect(composed.problems).toHaveLength(1);
    expect(composed.problems[0]).toContain("only its renderer turns into markup");
  });
});
