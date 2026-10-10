// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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

// The project is the directory the assembly's own stands in.
const problemsOf = (assembly: DiscoveredAssembly) =>
  styleProblems(dirname(assembly.directory), [assembly]);

describe("what the build cannot carry from an assembly's stylesheets", () => {
  it("passes a sheet whose references are all there, and ones it need not carry", () => {
    const css = `@import "https://fonts.example/a.css"; @import url(/site.css); .a { background: url(bg.png) } .b { background: url(data:image/png;base64,AA) }`;
    expect(problemsOf(withCss(css, { "bg.png": "png" }))).toEqual([]);
  });

  it("reports CSS it cannot parse, with where, as a problem rather than a crash", () => {
    expect(problemsOf(withCss(".a { color: red"))[0]).toMatchObject({
      rule: "an-assembly-owns-its-styles",
      message: expect.stringMatching(/cart\.css:1:1 is not CSS the build can read: Unclosed block/),
    });
  });

  it("reports a relative @import, and a url() naming a file that is not there", () => {
    const problems = problemsOf(
      withCss(`@import "./more.css"; .a { background: url(./gone.png) }`),
    );
    expect(problems.map((problem) => problem.message)).toEqual([
      '"cart" imports ./more.css, which the built stylesheet cannot reach',
      '"cart" names ./gone.png, and there is no such file',
    ]);
  });

  it("reports a url() leading outside the assembly's directory, by ../ or by a link", () => {
    const outside = withCss(".a { background: url(../../../../../../../../../../../etc/passwd) }");
    expect(problemsOf(outside)[0]?.message).toMatch(/outside its own directory/);
    const linked = withCss(".a { background: url(linked.txt) }");
    symlinkSync("/etc/hostname", join(linked.directory, "linked.txt"));
    expect(problemsOf(linked)[0]?.message).toMatch(/outside its own directory/);
  });

  it("reports a selector that reaches a sibling of the envelope, which is outside the assembly", () => {
    expect(problemsOf(withCss(":scope ~ .note { color: red }"))[0]?.message).toMatch(
      /sibling of its own envelope with :scope ~ .note/,
    );
  });

  // Asked before the file is looked for, so check never says whether a file outside is there.
  it("says a file named outside the assembly is outside, whether or not it is there", () => {
    for (const reference of ["../../../../../../no-such-file-anywhere.png", "../beside.png"]) {
      expect(problemsOf(withCss(`.a { background: url(${reference}) }`))[0]?.message).toBe(
        `"cart" names ${reference}, which is outside its own directory`,
      );
    }
  });

  it("does not open a stylesheet that leads out of the project, nor say anything of it", () => {
    const outside = mkdtempSync(join(tmpdir(), "style-outside-"));
    writeFileSync(join(outside, "secret.css"), "p { color: SECRET-COLOUR");
    const cart = withCss(".a { color: red }");
    symlinkSync(join(outside, "secret.css"), join(cart.directory, "more.css"));
    expect(
      problemsOf({ ...cart, styles: [...cart.styles, join(cart.directory, "more.css")] }),
    ).toEqual([]);
  });
});
