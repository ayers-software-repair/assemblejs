// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderAssembly, resolveRoot } from "@assemblejs/mcp";
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

describe("rendering an assembly for an agent", () => {
  it("shows what it actually produced, wrapped in the real envelope", async () => {
    assembly("cart", "cart.html", "<p>Two items</p>");
    const rendered = await renderAssembly(root, "cart");

    expect(rendered.problems).toEqual([]);
    expect(rendered.renderer).toBe("html");
    // The real envelope, not an approximation of one: this is what the server would emit.
    expect(rendered.html).toContain("<assembly-root");
    expect(rendered.html).toContain(`data-name="cart"`);
    expect(rendered.html).toContain("<p>Two items</p>");
    expect(rendered.html).toContain(`<script type="application/json"`);
  });

  it("refuses markdown, whose source only its renderer turns into markup", async () => {
    assembly("notes", "notes.md", "# Notes");
    const rendered = await renderAssembly(root, "notes");
    expect(rendered.html).toBe("");
    expect(rendered.problems.join()).toContain("only its renderer turns into markup");
  });

  // The expert behaviour: it says what it cannot do and why, rather than approximating.
  // Showing an agent something that is not what ships is worse than showing it nothing,
  // because it will believe it.
  it("refuses a framework view with the reason, rather than approximating it", async () => {
    assembly("counter", "counter.react.tsx", "export default () => null;");
    const rendered = await renderAssembly(root, "counter");
    expect(rendered.html).toBe("");
    expect(rendered.problems.join()).toContain("only its renderer turns into markup");
    expect(rendered.problems.join()).toContain("react");
  });

  it("names the assemblies that do exist when asked for one that does not", async () => {
    assembly("cart", "cart.html", "<p>x</p>");
    assembly("header", "header.html", "<p>y</p>");
    const rendered = await renderAssembly(root, "checkout");
    // An agent that is told "not found" guesses; one that is told what IS there does not.
    expect(rendered.problems.join()).toContain("cart");
    expect(rendered.problems.join()).toContain("header");
  });

  it("says the project has none at all rather than listing nothing", async () => {
    expect((await renderAssembly(root, "cart")).problems.join()).toContain("none at all");
  });

  // Through the transport a server renders with, so what a view places is composed inside it.
  it("composes every assembly its view places inside it, with the account of each", async () => {
    assembly("shell", "shell.html", '<section><assembly name="cart"></assembly></section>');
    assembly("cart", "cart.html", '<p>Two items</p><assembly name="price"></assembly>');
    assembly("price", "price.html", "<b>9.99</b>");
    const rendered = await renderAssembly(root, "shell");

    expect(rendered.problems).toEqual([]);
    expect(rendered.html).not.toContain("<assembly ");
    expect(rendered.html).toMatch(
      /data-name="shell".*data-name="cart".*Two items.*data-name="price".*9\.99/s,
    );
    expect(rendered.children).toMatchObject([
      { name: "cart", source: "local", children: [{ name: "price", source: "local" }] },
    ]);
  });

  it("shows a child that cannot be shown as the server shows one that did not render, and says why", async () => {
    assembly(
      "shell",
      "shell.html",
      '<section><assembly name="counter"></assembly><assembly name="nope"></assembly></section>',
    );
    assembly("counter", "counter.react.tsx", "export default () => null;");
    const rendered = await renderAssembly(root, "shell");

    expect(rendered.html).toContain('data-name="shell"');
    expect(rendered.html.match(/data-failed=/g)).toHaveLength(2);
    expect(rendered.children.map((child) => child.source)).toEqual(["fallback", "fallback"]);
    expect(rendered.problems).toHaveLength(2);
    expect(rendered.problems[0]).toContain('"counter" is a react assembly');
    expect(rendered.problems[1]).toBe(
      'there is no assembly "nope". This project has: counter, shell',
    );
  });

  it("refuses an assembly that places itself, as every render does", async () => {
    assembly("loop", "loop.html", '<p>loop</p><assembly name="loop"></assembly>');
    const rendered = await renderAssembly(root, "loop");
    expect(rendered.children).toMatchObject([
      { name: "loop", source: "fallback", reason: "cycle" },
    ]);
    expect(rendered.problems.join()).toContain('"loop" was answered by the fallback after cycle');
  });
});
