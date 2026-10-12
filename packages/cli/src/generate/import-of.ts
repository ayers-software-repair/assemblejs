// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { importPath } from "./import-path.js";

/**
 * The line a generated module in `from` imports a file with, under the clause given. A file
 * that is not TypeScript, a template or a Svelte or a Vue component, is one the bundler reads
 * and the compiler has no declaration for, so its line follows a comment that has the compiler
 * pass over it, and a project that type-checks is not failed by a module it did not write.
 *
 * A comment and not a declaration: one for `*.svelte` or `*.vue` written into a project meets
 * the one Svelte ships and the one a Vue project keeps, and two declarations of one pattern are
 * an error where libraries are checked and an arbitrary choice between them where they are not.
 *
 * A common linter rule refuses that comment, in a module no hand wrote, so the line above it
 * has a linter pass over it too. It names no rule: one that named the rule would be an error
 * in a project whose linter does not have it.
 */
export function importOf(clause: string, from: string, file: string): string {
  const line = `import ${clause} from "${importPath(from, file)}";`;
  return /\.[cm]?tsx?$/.test(file)
    ? line
    : `// eslint-disable-next-line\n// @ts-ignore: not TypeScript, and read by the build\n${line}`;
}
