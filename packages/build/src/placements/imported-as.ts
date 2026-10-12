// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isRendererClient } from "./is-renderer-client.js";

const IMPORT = /import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
const NAMESPACE = /import\s*\*\s*as\s+([\w$]+)\s*from\s*["']([^"']+)["']/g;

/**
 * The names a component's source writes a renderer's export as, read as text: the name itself,
 * what it is renamed to with `as`, or the name under a namespace the whole client is imported
 * as, `client.slot`. For a Svelte or a Vue component, whose slot is written in its markup and
 * not in a module this package parses.
 */
export function importedAs(source: string, exported: string): readonly string[] {
  const locals: string[] = [];
  for (const [, names = "", from = ""] of source.matchAll(IMPORT)) {
    if (!isRendererClient(from)) continue;
    for (const one of names.split(",")) {
      const [name, as, local] = one.trim().split(/\s+/);
      if (name !== exported) continue;
      locals.push(as === "as" && local !== undefined ? local : name);
    }
  }
  for (const [, namespace = "", from = ""] of source.matchAll(NAMESPACE)) {
    if (isRendererClient(from)) locals.push(`${namespace}.${exported}`);
  }
  return locals;
}
