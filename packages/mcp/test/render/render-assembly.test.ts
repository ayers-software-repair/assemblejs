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
  it("shows what it actually produced, wrapped in the real envelope", () => {
    assembly("cart", "cart.html", "<p>Two items</p>");
    const rendered = renderAssembly(root, "cart");

    expect(rendered.problems).toEqual([]);
    expect(rendered.renderer).toBe("html");
    // The real envelope, not an approximation of one: this is what the server would emit.
    expect(rendered.html).toContain("<assembly-root");
    expect(rendered.html).toContain(`data-name="cart"`);
    expect(rendered.html).toContain("<p>Two items</p>");
    expect(rendered.html).toContain(`<script type="application/json"`);
  });

  it("renders markdown, whose file is also its own output", () => {
    assembly("notes", "notes.md", "# Notes");
    expect(renderAssembly(root, "notes").problems).toEqual([]);
  });

  // The expert behaviour: it says what it cannot do and why, rather than approximating.
  // Showing an agent something that is not what ships is worse than showing it nothing,
  // because it will believe it.
  it("refuses a framework view with the reason, rather than approximating it", () => {
    assembly("counter", "counter.react.tsx", "export default () => null;");
    const rendered = renderAssembly(root, "counter");
    expect(rendered.html).toBe("");
    expect(rendered.problems.join()).toContain("has to be compiled");
    expect(rendered.problems.join()).toContain("react");
  });

  it("names the assemblies that do exist when asked for one that does not", () => {
    assembly("cart", "cart.html", "<p>x</p>");
    assembly("header", "header.html", "<p>y</p>");
    const rendered = renderAssembly(root, "checkout");
    // An agent that is told "not found" guesses; one that is told what IS there does not.
    expect(rendered.problems.join()).toContain("cart");
    expect(rendered.problems.join()).toContain("header");
  });

  it("says the project has none at all rather than listing nothing", () => {
    expect(renderAssembly(root, "cart").problems.join()).toContain("none at all");
  });
});
