// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProject } from "@assemblejs/cli";

const check = (assemblies: Record<string, string>, pages: Record<string, string> = {}) => {
  const root = mkdtempSync(join(tmpdir(), "view-problems-"));
  writeFileSync(join(root, "package.json"), "{}");
  const files = {
    "src/server.ts": "",
    "src/pages/home/home.html": '<body><assembly name="shell"></assembly></body>',
    ...Object.fromEntries(
      Object.entries(assemblies).map(([path, contents]) => [`src/assemblies/${path}`, contents]),
    ),
    ...pages,
  };
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return checkProject(root);
};
const one = (name: string) => `<assembly name="${name}"></assembly>`;
const lit = (body: string, shadow = false) =>
  `import { slot } from "@assemblejs/renderer-lit/client";\nimport { html } from "lit";\n${shadow ? "export const shadow = true;\n" : ""}export default () => html\`<section>${body}</section>\`;`;
// Only what this file is about: a project with no lit installed is told so by another rule.
const about = async (found: ReturnType<typeof check>, ...rules: string[]) =>
  (await found).filter((problem) => rules.includes(problem.rule));

describe("what is wrong with what the views of a project place", () => {
  it("is nothing when every view places what exists", async () => {
    expect(
      await check({ "shell/shell.html": one("cart"), "cart/cart.html": "<p>cart</p>" }),
    ).toEqual([]);
  });

  it("refuses a name with no assembly behind it, in the view that places it", async () => {
    const found = await check({ "shell/shell.html": one("nope"), "cart/cart.html": "" });
    expect(found).toMatchObject([
      {
        path: "src/assemblies/shell/shell.html",
        rule: "a-placement-names-an-assembly",
        fix: "add it, or place one that exists: cart, shell",
      },
    ]);
    expect(found[0]?.message).toBe('"shell" places "nope", and there is no such assembly');
  });

  it("refuses a view that places itself, and views that place each other", async () => {
    expect(await check({ "shell/shell.html": one("shell") })).toMatchObject([
      { rule: "an-assembly-is-never-its-own-ancestor" },
    ]);
    const round = await check({ "shell/shell.html": one("cart"), "cart/cart.html": one("shell") });
    expect(round.map((problem) => [problem.path, problem.rule])).toEqual([
      ["src/assemblies/cart/cart.html", "an-assembly-is-never-its-own-ancestor"],
      ["src/assemblies/shell/shell.html", "an-assembly-is-never-its-own-ancestor"],
    ]);
  });

  it("refuses a Lit assembly in a Lit view's own tree, at any depth, and names the fix", async () => {
    const found = await about(
      check({
        "shell/shell.lit.ts": lit('${slot("card")}'),
        "card/card.html": one("badge"),
        "badge/badge.lit.ts": lit("badge"),
      }),
      "lit-holds-lit-behind-a-shadow-root",
    );
    expect(found).toMatchObject([{ path: "src/assemblies/shell/shell.lit.ts" }]);
    expect(found[0]?.message).toContain('"shell" is a Lit view with "badge", a Lit assembly');
    expect(found[0]?.fix).toContain("export const shadow = true in badge.lit.ts");
  });

  it("allows a Lit assembly behind a shadow root, its own or one between the two", async () => {
    const rule = "lit-holds-lit-behind-a-shadow-root";
    expect(
      await about(
        check({
          "shell/shell.lit.ts": lit('${slot("badge")}'),
          "badge/badge.lit.ts": lit("badge", true),
        }),
        rule,
      ),
    ).toEqual([]);
    expect(
      await about(
        check({
          "shell/shell.lit.ts": lit('${slot("card")}'),
          // Not Lit itself, so the only Lit view here is the shell, and this root hides the badge.
          "card/card.react.tsx":
            'import { Slot } from "@assemblejs/renderer-react/client";\nexport const shadow = true;\nexport default () => <Slot name="badge" />;',
          "badge/badge.lit.ts": lit("badge"),
        }),
        rule,
      ),
    ).toEqual([]);
  });

  // A static parent has no browser half; the one its child has still puts the runtime on the
  // page, so a deferral there has something to fill it.
  it("counts what a view places when it asks whether a page carries the runtime", async () => {
    const page = {
      "src/pages/home/home.page.ts":
        'import { definePage } from "@assemblejs/core";\nexport default definePage({ place: { shell: { defer: true } } });',
    };
    const react = "export default () => <p>live</p>;";
    expect(
      await about(
        check({ "shell/shell.html": one("live"), "live/live.react.tsx": react }, page),
        "policy-names-a-placement",
      ),
    ).toEqual([]);
    const still = await about(
      check({ "shell/shell.html": one("still"), "still/still.html": "<p>still</p>" }, page),
      "policy-names-a-placement",
    );
    expect(still[0]?.message).toContain("nothing would fill it");
  });
});
