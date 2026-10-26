// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { placeInView, resolveRoot } from "@asmjs/mcp";

const project = (files: Record<string, string>): string => {
  const dir = mkdtempSync(join(tmpdir(), "mcp-place-in-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(dir, "src", "assemblies", path, ".."), { recursive: true });
    writeFileSync(join(dir, "src", "assemblies", path), contents);
  }
  return dir;
};
const FILES = {
  "shell/shell.html": '<section>\n<assembly name="nav"></assembly>\n</section>',
  "nav/nav.html": "<p>nav</p>",
  "cart/cart.html": "<p>cart</p>",
  "card/card.ejs": "<article><%= data.title %></article>",
  "panel/panel.react.tsx": "export default () => null;",
  "board/board.svelte": "<p>board</p>",
  "notes/notes.md": "# Notes",
};

describe("placing one assembly in another's view through the agent surface", () => {
  it("writes the directive into a view that holds it as markup, at the named position", () => {
    const dir = project(FILES);
    const answer = placeInView(resolveRoot(dir), "shell", "cart", { after: "nav" });
    expect(answer).toMatchObject({
      ok: true,
      result: {
        written: ["src/assemblies/shell/shell.html"],
        inserted: '<assembly name="cart"></assembly>',
      },
      next: ['see "cart" inside it with render_assembly on shell'],
    });
    expect(readFileSync(join(dir, "src/assemblies/shell/shell.html"), "utf8")).toBe(
      '<section>\n<assembly name="nav"></assembly>\n<assembly name="cart"></assembly>\n</section>',
    );
    // A template in a language that holds the directive as markup is written the same way.
    expect(placeInView(resolveRoot(dir), "card", "cart", { at: "end" }).ok).toBe(true);
    expect(readFileSync(join(dir, "src/assemblies/card/card.ejs"), "utf8")).toBe(
      '<article><%= data.title %></article>\n<assembly name="cart"></assembly>',
    );
  });

  it("says a second placing of the same child, which is allowed and may not be meant", () => {
    const dir = project(FILES);
    const once = placeInView(resolveRoot(dir), "shell", "cart", { at: "end" });
    expect(once.result).toMatchObject({ placed: 1 });
    expect(once.next?.join()).not.toContain("times");
    const again = placeInView(resolveRoot(dir), "shell", "cart", { at: "end" });
    expect(again).toMatchObject({ ok: true, result: { placed: 2 } });
    expect(again.next?.[0]).toBe(
      '"cart" is placed 2 times in this view now: take one out if another was not meant',
    );
  });

  it("answers the line to write for a view its author writes, and edits nothing", () => {
    const dir = project(FILES);
    const react = placeInView(resolveRoot(dir), "panel", "cart", { at: "end" });
    expect(react).toMatchObject({
      ok: false,
      problems: [
        {
          path: "src/assemblies/panel/panel.react.tsx",
          rule: "a-view-places-a-child-with-the-directive",
          fix: 'import { Slot } from "@asmjs/renderer-react/client", then write <Slot name="cart" /> where the child should stand',
        },
      ],
    });
    expect(readFileSync(join(dir, "src/assemblies/panel/panel.react.tsx"), "utf8")).toBe(
      "export default () => null;",
    );
    const fix = (parent: string) =>
      (placeInView(resolveRoot(dir), parent, "cart", { at: "end" }).problems[0] as { fix: string })
        .fix;
    expect(fix("board")).toContain('{@html slot("cart")}');
    expect(fix("notes")).toContain("a Markdown view is prose and places nothing");
  });

  it("refuses a name with no assembly, and an assembly inside itself", () => {
    const dir = project(FILES);
    expect(
      placeInView(resolveRoot(dir), "shell", "footer", { at: "end" }).problems[0],
    ).toMatchObject({
      rule: "a-placement-names-an-assembly",
      message: 'there is no assembly "footer"',
    });
    expect(placeInView(resolveRoot(dir), "nowhere", "cart", { at: "end" }).ok).toBe(false);
    expect(
      placeInView(resolveRoot(dir), "shell", "shell", { at: "end" }).problems[0],
    ).toMatchObject({ rule: "an-assembly-is-never-its-own-ancestor" });
    expect(readFileSync(join(dir, "src/assemblies/shell/shell.html"), "utf8")).toBe(
      FILES["shell/shell.html"],
    );
  });

  // Only an assembly placed in itself was refused. One placed in what it already holds, at any
  // depth, was written and answered as done, and every render of either then refused it.
  it("refuses an assembly inside one it already leads to, at any depth, and writes nothing", () => {
    const dir = project({
      ...FILES,
      "nav/nav.html": '<nav><assembly name="menu"></assembly></nav>',
      "menu/menu.html": "<ul></ul>",
    });
    // shell holds nav, and nav holds menu.
    for (const [parent, child, chain] of [
      ["nav", "shell", "shell, nav"],
      ["menu", "shell", "shell, nav, menu"],
      ["menu", "nav", "nav, menu"],
    ] as const) {
      const before = readFileSync(join(dir, `src/assemblies/${parent}/${parent}.html`), "utf8");
      expect(placeInView(resolveRoot(dir), parent, child, { at: "end" }).problems[0]).toMatchObject(
        {
          rule: "an-assembly-is-never-its-own-ancestor",
          message: `"${child}" already holds "${parent}" (${chain}), so it cannot be placed inside it`,
        },
      );
      expect(readFileSync(join(dir, `src/assemblies/${parent}/${parent}.html`), "utf8")).toBe(
        before,
      );
    }
    // The other way round is no circle.
    expect(placeInView(resolveRoot(dir), "cart", "menu", { at: "end" }).ok).toBe(true);
  });

  // Told to add an assembly whose directory is there, and add refusing the name as taken, an
  // agent went round between the two.
  it("says to mend a directory that is there and is not an assembly, not to add it", () => {
    const dir = project({ ...FILES, "twin/twin.html": "<p>a</p>", "twin/twin.svelte": "<p>b</p>" });
    expect(placeInView(resolveRoot(dir), "shell", "twin", { at: "end" }).problems[0]).toMatchObject(
      {
        rule: "a-placement-names-an-assembly",
        message: 'there is no assembly "twin"',
        fix: "src/assemblies/twin is there and is not an assembly yet: mend what is said of that directory",
      },
    );
  });
});
