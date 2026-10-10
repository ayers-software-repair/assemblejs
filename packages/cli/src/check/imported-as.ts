// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isRendererClient } from "./is-renderer-client.js";

const IMPORT = /import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;

/**
 * The names a component's source imports a renderer's export under, read as text: the name
 * itself, or what it is renamed to with `as`. For a Svelte or a Vue component, whose slot is
 * written in its markup and not in a module this package parses.
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
  return locals;
}
