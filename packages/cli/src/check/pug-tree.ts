// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PugCompiler } from "../build/pug-compiler.js";

/**
 * The tree Pug's own parser makes of a template, taken as Pug compiles it: a plugin's
 * `postParse` is handed the tree, and answers it unchanged for the compile to go on with.
 *
 * Undefined for a source Pug cannot compile, which the template's own rule reports with what
 * Pug said, and where a compiler never hands its tree over. Nothing is rendered: compiling a
 * template runs none of it.
 */
export function pugTree(pug: PugCompiler, source: string): unknown {
  let tree: unknown;
  try {
    pug.compile(source, {
      plugins: [
        {
          postParse: (parsed) => {
            tree = parsed;
            return parsed;
          },
        },
      ],
    });
  } catch {
    return undefined;
  }
  return tree;
}
