// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic, LogLine } from "@assemblejs/core";
import { noSuchAssembly } from "../render/no-such-assembly.js";

/**
 * What an agent is told about every placement that was not answered by its own content, at any
 * depth: a name with no assembly behind it, with the ones that exist; what a render threw, the
 * reason a view needs a build among them, found by the id its failure was logged against; and
 * otherwise the rung that answered and why. Each thing once.
 */
export function fallbackProblems(
  diagnostics: readonly Diagnostic[],
  names: readonly string[],
  logged: readonly LogLine[],
): readonly string[] {
  const thrown = new Map(logged.map((line) => [line.correlationId, line.message]));
  const problems = new Set<string>();
  const read = (placed: readonly Diagnostic[], inside: string): void => {
    for (const one of placed) {
      if (one.reason !== undefined) {
        const said = one.correlationId === undefined ? undefined : thrown.get(one.correlationId);
        problems.add(
          !names.includes(one.name)
            ? noSuchAssembly(one.name, names)
            : (said ??
                `"${one.name}"${inside} was answered by the ${one.source} after ${one.reason}`),
        );
      }
      read(one.children ?? [], `${inside} inside "${one.name}"`);
    }
  };
  read(diagnostics, "");
  return [...problems];
}
