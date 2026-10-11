// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { composeTemplate, resolveRoot } from "@assemblejs/mcp";
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

// The project's own dev server, as the agent surface finds it: a record under the root, and a
// server answering its health and the content endpoint for what only it renders.
const devServer = createServer((request, response) => {
  if (request.url === "/_assemblejs/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end('{"status":"ok","version":"v"}');
    return;
  }
  const name = /^\/assembly\/([a-z-]+)\//.exec(request.url ?? "")?.[1] ?? "none";
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(
    `<assembly-root data-name="${name}" data-id="x" data-view="default" data-renderer="react"><button>served ${name}</button></assembly-root>`,
  );
});
let devOrigin = "";
beforeAll(async () => {
  await new Promise<void>((resolve) => devServer.listen(0, "127.0.0.1", resolve));
  devOrigin = `http://127.0.0.1:${String((devServer.address() as AddressInfo).port)}`;
});
afterAll(() => new Promise<void>((resolve) => devServer.close(() => resolve())));
const devRunning = (): void => {
  mkdirSync(join(dir, ".assemblejs"), { recursive: true });
  writeFileSync(join(dir, ".assemblejs", "dev.json"), JSON.stringify({ url: devOrigin }));
};

describe("composing through the project's dev server", () => {
  it("asks the running server for every placement, so the page is what the project serves", async () => {
    assembly("ok", "ok.html", "<p>on disk</p>");
    assembly("counter", "counter.react.tsx", "export default () => null;");
    devRunning();
    const composed = await composeTemplate(
      root,
      `<main><assembly name="ok"/><assembly name="counter"/></main>`,
    );
    expect(composed.problems).toEqual([]);
    expect(composed.html).toContain("served ok");
    expect(composed.html).toContain("served counter");
    expect(composed.diagnostics.map((d) => d.source)).toEqual(["remote", "remote"]);
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
