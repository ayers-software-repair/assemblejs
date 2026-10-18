// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectProblem } from "@assemblejs/build";

/** Each thing wrong with how a config writes its budgets, as a finding against the config. */
export function budgetProblems(
  configFile: string,
  problems: readonly string[],
): readonly ProjectProblem[] {
  return problems.map((message): ProjectProblem => ({
    path: configFile,
    rule: "a-budget-is-whole-bytes",
    message,
    fix: "write budgets as { document, styles, scripts, mount, total }, each a whole number of gzipped bytes above zero",
  }));
}
