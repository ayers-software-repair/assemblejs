// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CssSyntaxError } from "postcss";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { TOKENS_FILE } from "../discovery/tokens-file.js";
import { OutsideRootError } from "../root/outside-root-error.js";
import { readInside } from "../root/read-inside.js";
import { contrastRatio } from "./contrast-ratio.js";
import { readTokens } from "./read-tokens.js";
import { TOKEN_INVARIANTS } from "./token-invariants.js";

/**
 * Every binding in the project's tokens that breaks its role's invariant, in either scheme
 * (`tokens-hold-their-contrast`), and a tokens file the reader cannot parse. A project without
 * the file has no tokens and nothing is judged; a role bound to anything but a hex colour, or
 * not bound at all, is not judged either, since the reader cannot be certain of it.
 */
export function tokenProblems(root: string): readonly ProjectProblem[] {
  const file = join(root, TOKENS_FILE);
  if (!existsSync(file)) return [];
  let tokens: ReturnType<typeof readTokens>;
  try {
    tokens = readTokens(readInside(root, file));
  } catch (error) {
    if (error instanceof OutsideRootError) return [];
    if (!(error instanceof CssSyntaxError)) throw error;
    return [
      {
        path: file,
        rule: "tokens-hold-their-contrast",
        message: `line ${String(error.line ?? 0)}, column ${String(error.column ?? 0)} is not CSS the check can read: ${error.reason}`,
        fix: "correct the stylesheet",
      },
    ];
  }
  const problems: ProjectProblem[] = [];
  for (const [scheme, bound] of [
    ["light", tokens.light],
    ["dark", tokens.dark],
  ] as const) {
    for (const { role, ground, least, because } of TOKEN_INVARIANTS) {
      const ratio = contrastRatio(bound.get(role) ?? "", bound.get(ground) ?? "");
      if (ratio === undefined || ratio >= least) continue;
      problems.push({
        path: file,
        rule: "tokens-hold-their-contrast",
        message: `${role} on ${ground} is ${(Math.floor(ratio * 100) / 100).toFixed(2)}:1 in the ${scheme} scheme; ${because}`,
        fix: `rebind ${role} or ${ground} in the ${scheme} scheme of ${TOKENS_FILE} so they read at ${String(least)}:1 or more`,
      });
    }
  }
  return problems;
}
