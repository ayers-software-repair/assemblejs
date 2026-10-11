// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { TOKENS_FILE } from "../discovery/tokens-file.js";
import { readInside } from "../root/read-inside.js";
import { literalColours } from "./literal-colours.js";

/**
 * Every literal colour an assembly's stylesheet sets (`a-colour-is-a-token`): a hex colour, a
 * colour function or a named colour in any declaration, a custom property's included, where the
 * tokens are the one place a colour is decided (DESIGN 10). A project without `src/tokens.css`
 * has no tokens to read, and nothing is judged; a stylesheet the reader cannot open or parse is
 * `styleProblems`' finding already, and is passed over here.
 */
export function colourProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): readonly ProjectProblem[] {
  if (!existsSync(join(root, TOKENS_FILE))) return [];
  const problems: ProjectProblem[] = [];
  for (const assembly of assemblies) {
    for (const file of assembly.styles) {
      let parsed: postcss.Root;
      try {
        parsed = postcss.parse(readInside(root, file), { from: file });
      } catch {
        continue;
      }
      parsed.walkDecls((declaration) => {
        for (const colour of literalColours(declaration.value)) {
          problems.push({
            path: file,
            rule: "a-colour-is-a-token",
            message: `"${assembly.name}" sets ${declaration.prop} to ${colour} at line ${String(declaration.source?.start?.line ?? 0)}, a colour decided outside ${TOKENS_FILE}`,
            fix: `read a token instead, var(--ink) or another role of ${TOKENS_FILE}; a colour the tokens lack is a new role there`,
          });
        }
      });
    }
  }
  return problems;
}
