// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectProblem } from "./project-problem.js";
import type { RuleId } from "./rule-id.js";

/**
 * A finding for each file in a directory that is nearly a declaration the project reads there
 * and is not the one: `cart.services.ts`, `service.ts`, or another's name on it where this one
 * has none of its own. Such a file is left out of the build, and nothing else says so.
 *
 * A declaration is read by one name, `<name>.<kind>.ts`. The same kind under another's name is
 * taken for a module of the author's own where the directory has the one that is read, or where
 * `shared` says any of that kind is read; a plural, or the kind with no name, is never read.
 */
export function unreadDeclarations(
  directory: string,
  files: readonly string[],
  name: string,
  rule: RuleId,
  kinds: readonly { readonly kind: string; readonly what: string; readonly shared?: boolean }[],
): readonly ProjectProblem[] {
  return files.flatMap((file) =>
    kinds.flatMap(({ kind, what, shared }) => {
      const read = `${name}.${kind}.ts`;
      const nearly = new RegExp(`^(?:(.+)\\.)?${kind}(s?)\\.ts$`).exec(file);
      if (nearly === null || file === read) return [];
      const [, stem, plural] = nearly;
      if (stem !== undefined && plural === "" && (shared === true || files.includes(read))) {
        return [];
      }
      return [
        {
          path: `${directory}/${file}`,
          rule,
          message: `"${file}" is not read: this ${what} is "${read}"`,
          fix: `rename it to "${read}", or remove it`,
        },
      ];
    }),
  );
}
