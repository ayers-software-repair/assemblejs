// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { styleProblems } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

const withCss = (css: string, files: Record<string, string> = {}): DiscoveredAssembly => {
  const directory = join(mkdtempSync(join(tmpdir(), "style-problems-")), "cart");
  mkdirSync(directory);
  writeFileSync(join(directory, "cart.css"), css);
  for (const [name, contents] of Object.entries(files))
    writeFileSync(join(directory, name), contents);
  return {
    name: "cart",
    directory,
    view: join(directory, "cart.html"),
    renderer: "html",
    client: undefined,
    service: undefined,
    styles: [join(directory, "cart.css")],
  };
};

describe("what the build cannot carry from an assembly's stylesheets", () => {
  it("passes a sheet whose references are all there, and ones it need not carry", () => {
    const css = `@import "https://fonts.example/a.css"; @import url(/site.css); .a { background: url(bg.png) } .b { background: url(data:image/png;base64,AA) }`;
    expect(styleProblems([withCss(css, { "bg.png": "png" })])).toEqual([]);
  });

  it("reports CSS it cannot parse, with where, as a problem rather than a crash", () => {
    expect(styleProblems([withCss(".a { color: red")])[0]).toMatchObject({
      rule: "an-assembly-owns-its-styles",
      message: expect.stringMatching(/cart\.css:1:1 is not CSS the build can read: Unclosed block/),
    });
  });

  it("reports a relative @import, and a url() naming a file that is not there", () => {
    const problems = styleProblems([
      withCss(`@import "./more.css"; .a { background: url(./gone.png) }`),
    ]);
    expect(problems.map((problem) => problem.message)).toEqual([
      '"cart" imports ./more.css, which the built stylesheet cannot reach',
      '"cart" names ./gone.png, and there is no such file',
    ]);
  });
});
