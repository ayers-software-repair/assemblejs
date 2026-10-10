// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

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
 * reached by a package's name is that package's, and is not read.
 */
export function viewModules(view: string): readonly string[] {
  const found: string[] = [];
  const read = (file: string): void => {
    if (found.includes(file)) return;
    let source: string;
    try {
      source = readFileSync(file, "utf8");
    } catch {
      return;
    }
    found.push(file);
    for (const [, written = ""] of source.matchAll(IMPORTED)) {
      const module = candidates(resolve(dirname(file), written)).find(
        (candidate) => COMPONENT.test(candidate) && isFile(candidate),
      );
      if (module !== undefined) read(module);
    }
  };
  read(view);
  return found;
}
