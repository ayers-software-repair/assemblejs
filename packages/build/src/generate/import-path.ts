// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { relative, resolve } from "node:path";

/**
 * The specifier a generated module in `from` uses to import `file`: relative, with forward
 * slashes, and a TypeScript source named by the `.js` the bundler resolves it from, which is
 * the same convention the author's own imports follow.
 */
export function importPath(from: string, file: string): string {
  const path = relative(from, resolve(file)).split("\\").join("/");
  const dotted = path.startsWith(".") ? path : `./${path}`;
  return dotted.replace(/\.tsx?$/, ".js");
}
