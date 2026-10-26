// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { colourProblems, discoverAssemblies } from "@asmjs/build";

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));
const problems = (files: Readonly<Record<string, string>>) => {
  root = mkdtempSync(join(tmpdir(), "colour-problems-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return colourProblems(root, discoverAssemblies(root).assemblies);
};

describe("a colour is a token", () => {
  it("refuses a literal colour in an assembly's stylesheet, a custom property's included, naming the line", () => {
    const found = problems({
      "src/tokens.css": ":root { --ink: #111; }",
      "src/assemblies/card/card.html": "<p>x</p>",
      "src/assemblies/card/card.css":
        ".card { color: var(--ink); border: 1px solid #ccc; }\n.card b { --tone: rgb(0 0 0); background: Tomato; }",
    });
    expect(found.map((one) => [one.rule, one.message])).toEqual([
      [
        "a-colour-is-a-token",
        '"card" sets border to #ccc at line 1, a colour decided outside src/tokens.css',
      ],
      [
        "a-colour-is-a-token",
        '"card" sets --tone to rgb(0 0 0) at line 2, a colour decided outside src/tokens.css',
      ],
      [
        "a-colour-is-a-token",
        '"card" sets background to Tomato at line 2, a colour decided outside src/tokens.css',
      ],
    ]);
    expect(found[0]?.fix).toContain("var(--ink)");
  });

  it("judges nothing in a project without tokens, and passes over a stylesheet it cannot parse", () => {
    expect(
      problems({
        "src/assemblies/card/card.html": "<p>x</p>",
        "src/assemblies/card/card.css": ".card { color: red; }",
      }),
    ).toEqual([]);
    expect(
      problems({
        "src/tokens.css": ":root { --ink: #111; }",
        "src/assemblies/card/card.html": "<p>x</p>",
        "src/assemblies/card/card.css": ".card { color: red",
      }),
    ).toEqual([]);
  });
});
