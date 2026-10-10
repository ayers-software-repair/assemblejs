// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { leadsOut } from "../root/leads-out.js";
import { readInside } from "../root/read-inside.js";

// A relative path named by an import, an export from, or a dynamic import.
const IMPORTED = /(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.{1,2}\/[^"']+)["']/g;
// The languages a slot can be written in.
const COMPONENT = /\.(?:[jt]sx?|svelte|vue)$/;

// What a path written in an import may be on disk: itself, the TypeScript behind a `.js`, a
// module written with no extension, or a directory's index.
const candidates = (path: string): readonly string[] => [
  path,
  path.replace(/\.js$/, ".ts"),
  path.replace(/\.jsx?$/, ".tsx"),
  ...[".ts", ".tsx", ".js", ".jsx"].flatMap((extension) => [
    `${path}${extension}`,
    join(path, `index${extension}`),
  ]),
];
const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

/**
 * A view's file and every module of the project it imports, directly or through one it
 * imports: the components its author split it into, where a slot may be written as well as in
 * the view itself. The view first, each file once.
 *
 * Only a relative path is followed, to a file in a language a slot can be written in. A module
 * reached by a package's name is that package's, and is not read. Neither is one outside the
 * project: an import that climbs out of the root, or names a link that leads out of it, is not
 * followed nor looked for, and is answered beside the modules, as it is written, for whoever
 * asked to report. A view that itself leads out has no modules here.
 */
export function viewModules(
  root: string,
  view: string,
): { readonly modules: readonly string[]; readonly outside: readonly string[] } {
  const modules: string[] = [];
  const outside: string[] = [];
  const read = (file: string): void => {
    if (modules.includes(file)) return;
    let source: string;
    try {
      source = readInside(root, file);
    } catch {
      return;
    }
    modules.push(file);
    for (const [, written = ""] of source.matchAll(IMPORTED)) {
      for (const candidate of candidates(resolve(dirname(file), written))) {
        if (!COMPONENT.test(candidate)) continue;
        // Asked before the candidate is looked for: what stands outside is not this project's.
        if (leadsOut(root, candidate)) {
          if (!outside.includes(written)) outside.push(written);
          break;
        }
        if (isFile(candidate)) {
          read(candidate);
          break;
        }
      }
    }
  };
  read(view);
  return { modules, outside };
}
