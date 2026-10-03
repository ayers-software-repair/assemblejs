// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { placeOnPage, resolveRoot } from "@assemblejs/mcp";

const project = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "mcp-place-"));
  for (const name of ["nav", "cart"]) {
    mkdirSync(join(dir, "src", "assemblies", name), { recursive: true });
    writeFileSync(join(dir, "src", "assemblies", name, `${name}.html`), `<p>${name}</p>`);
  }
  mkdirSync(join(dir, "src", "pages", "home"), { recursive: true });
  writeFileSync(
    join(dir, "src", "pages", "home", "home.html"),
    '<body>\n<assembly name="nav"></assembly>\n</body>',
  );
  return dir;
};

describe("placing an assembly through the agent surface", () => {
  it("edits the page's template at the named position and answers with the change", () => {
    const dir = project();
    const answer = placeOnPage(resolveRoot(dir), "home", "cart", { after: "nav" });
    expect(answer).toMatchObject({
      ok: true,
      result: {
        written: ["src/pages/home/home.html"],
        inserted: '<assembly name="cart"></assembly>',
      },
    });
    expect(readFileSync(join(dir, "src", "pages", "home", "home.html"), "utf8")).toBe(
      '<body>\n<assembly name="nav"></assembly>\n<assembly name="cart"></assembly>\n</body>',
    );
  });

  it("knows what it cannot know: a page or an assembly that does not exist is listed, not made", () => {
    const dir = project();
    expect(placeOnPage(resolveRoot(dir), "about", "cart", { at: "end" }).problems[0]).toMatchObject(
      {
        rule: "a-directory-is-a-page",
        fix: "place it on one that exists: home",
      },
    );
    expect(
      placeOnPage(resolveRoot(dir), "home", "footer", { at: "end" }).problems[0],
    ).toMatchObject({
      rule: "a-placement-names-an-assembly",
      fix: expect.stringContaining("cart, nav"),
    });
    expect(readFileSync(join(dir, "src", "pages", "home", "home.html"), "utf8")).not.toContain(
      "footer",
    );
  });

  it("passes on the command line's refusal of a neighbour the template does not place", () => {
    const dir = project();
    expect(placeOnPage(resolveRoot(dir), "home", "cart", { before: "footer" }).ok).toBe(false);
  });
});
