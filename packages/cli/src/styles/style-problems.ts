// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import postcss, { CssSyntaxError } from "postcss";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { insideDirectory } from "./inside-directory.js";
import { styleReferences } from "./style-references.js";

/**
 * Everything in the assemblies' stylesheets the build could not carry into `dist/` intact: CSS
 * it cannot parse, and so cannot scope; an `@import` of a file beside it, which the served sheet
 * could not reach; a `url()` naming a file that is not there, or one outside the assembly's own
 * directory, which the build would otherwise publish. `build` and `check` both report
 * these, before anything is bundled.
 */
export function styleProblems(
  assemblies: readonly DiscoveredAssembly[],
): readonly ProjectProblem[] {
  const problems: ProjectProblem[] = [];
  for (const assembly of assemblies) {
    for (const file of assembly.styles) {
      let root: postcss.Root;
      try {
        root = postcss.parse(readFileSync(file, "utf8"), { from: file });
      } catch (error) {
        if (!(error instanceof CssSyntaxError)) throw error;
        problems.push({
          path: file,
          rule: "an-assembly-owns-its-styles",
          message: `${file}:${String(error.line ?? 0)}:${String(error.column ?? 0)} is not CSS the build can read: ${error.reason}`,
          fix: "correct the stylesheet",
        });
        continue;
      }
      root.walkAtRules(/^import$/i, (rule) => {
        const imported = /^(?:url\(\s*)?["']?([^"')\s]+)/.exec(rule.params)?.[1] ?? "";
        if (/^([a-z][a-z0-9+.-]*:|\/)/i.test(imported)) return;
        problems.push({
          path: file,
          rule: "an-assembly-owns-its-styles",
          message: `"${assembly.name}" imports ${imported}, which the built stylesheet cannot reach`,
          fix: `move it into a .css file in src/assemblies/${assembly.name}/, where every stylesheet is included`,
        });
      });
      root.walkDecls((declaration) => {
        for (const reference of styleReferences(declaration.value)) {
          const target = resolve(dirname(file), reference.split(/[?#]/)[0] ?? "");
          if (!existsSync(target)) {
            problems.push({
              path: file,
              rule: "an-assembly-owns-its-styles",
              message: `"${assembly.name}" names ${reference}, and there is no such file`,
              fix: `add ${reference} beside the stylesheet, or correct the url`,
            });
          } else if (!insideDirectory(assembly.directory, target)) {
            problems.push({
              path: file,
              rule: "an-assembly-owns-its-styles",
              message: `"${assembly.name}" names ${reference}, which is outside its own directory`,
              fix: `move the file into src/assemblies/${assembly.name}/, where the build may publish it`,
            });
          }
        }
      });
    }
  }
  return problems;
}
