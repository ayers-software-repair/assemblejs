// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { OutsideRootError, describeProject, resolveRoot } from "@assemblejs/mcp";
import type { ProjectRoot } from "@assemblejs/mcp";

let root: ProjectRoot;
let dir = "";

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "assemblejs-mcp-project-"));
  mkdirSync(join(dir, "src", "assemblies"), { recursive: true });
  root = resolveRoot(dir);
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const file = (path: string, contents = ""): void => {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), contents);
};

describe("the project's whole shape", () => {
  it("is one read, so an agent does not spend turns asking what exists", () => {
    file("src/assemblies/cart/cart.svelte");
    file("src/assemblies/counter/counter.react.tsx");
    const project = describeProject(root);
    expect(project.assemblies.map((a) => a.name)).toEqual(["cart", "counter"]);
    expect(project.renderers).toEqual(["react", "svelte"]);
    expect(project.root).toBe(dir);
  });

  it("is the pages, the apis and the config too, and how they are wired", () => {
    file("src/assemblies/cart/cart.html", "<p>cart</p>");
    file("src/pages/home/home.html", '<main><assembly name="cart"></assembly></main>');
    file("src/pages/home/home.page.ts", "export default { place: { cart: { defer: true } } };");
    file(
      "src/api/prices.api.ts",
      'export default { path: "/api/prices", stream: () => undefined };',
    );
    file("assemblejs.config.ts", "export default { budgets: { document: 14000 } };");
    const project = describeProject(root);
    expect(project.pages).toMatchObject([
      {
        name: "home",
        route: "/",
        places: [{ name: "cart", view: "default" }],
        policy: { cart: { defer: true } },
      },
    ]);
    expect(project.assemblies[0]?.placedOn).toEqual(["home"]);
    expect(project.apis).toMatchObject([{ path: "/api/prices", method: "GET", streams: true }]);
    expect(project.settings).toMatchObject({
      file: "assemblejs.config.ts",
      budgets: { document: 14000 },
    });
  });

  it("says which assemblies have a browser half", () => {
    file("src/assemblies/cart/cart.html");
    file("src/assemblies/cart/cart.client.ts");
    file("src/assemblies/note/note.html");
    expect(describeProject(root).assemblies).toMatchObject([
      { name: "cart", client: "src/assemblies/cart/cart.client.ts", browserHalf: true },
      { name: "note", browserHalf: false },
    ]);
  });

  it("carries the problems rather than hiding them behind an empty list", () => {
    mkdirSync(join(dir, "src", "assemblies", "Broken"), { recursive: true });
    const [problem] = describeProject(root).problems;
    expect(problem?.message).toContain("Broken");
    expect(problem?.fix).toBe('rename the directory to "broken"');
    expect(problem?.path).toBe("src/assemblies/Broken");
  });

  it("is an empty project, not a broken one, when nothing has been written yet", () => {
    const project = describeProject(root);
    expect(project.assemblies).toEqual([]);
    expect(project.pages).toEqual([]);
    expect(project.apis).toEqual([]);
    expect(project.problems).toEqual([]);
  });

  // The shape is read from four places, and each is held to the root before anything beneath
  // it is opened. A link one level further down is not: the readers follow it, as `check` does.
  it("refuses each of the four places it reads from where one leads out of the project", () => {
    const outside = mkdtempSync(join(tmpdir(), "assemblejs-mcp-outside-"));
    try {
      mkdirSync(join(outside, "home"));
      writeFileSync(join(outside, "home", "home.html"), "<main>not this project's</main>");
      writeFileSync(join(outside, "config.ts"), "export default { budgets: { document: 1 } };");
      for (const [link, target] of [
        ["src/pages", outside],
        ["src/api", outside],
        ["assemblejs.config.ts", join(outside, "config.ts")],
      ] as const) {
        symlinkSync(target, join(dir, link));
        expect(() => describeProject(root), link).toThrow(OutsideRootError);
        rmSync(join(dir, link));
      }
      expect(describeProject(root).pages).toEqual([]);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
