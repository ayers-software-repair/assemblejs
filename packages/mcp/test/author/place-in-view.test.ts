// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { placeInView, resolveRoot } from "@assemblejs/mcp";

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
      '<article><%= data.title %></article><assembly name="cart"></assembly>\n',
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
          fix: 'import { Slot } from "@assemblejs/renderer-react/client", then write <Slot name="cart" /> where the child should stand',
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
});
