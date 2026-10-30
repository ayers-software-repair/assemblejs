// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import type { PugCompiler } from "@asmjs/build";
import type { DiscoveredAssembly } from "@asmjs/build";
import { loadPug } from "@asmjs/build";
import { isStaticView } from "@asmjs/build";
import { viewModules } from "@asmjs/build";
import { leadsOut } from "@asmjs/build";
import { readInside } from "@asmjs/build";
import { readViewElements } from "./read-view-elements.js";
import type { ViewElement } from "./view-element.js";
import type { WrittenElement } from "./written-element.js";

/**
 * The elements each assembly's view writes, by name, with the file each element is in: the view
 * and, for a framework view, the components it is split into, as the placement reader follows
 * them. A view that cannot be read for its elements, or that leads out of the project, is left
 * out, and the rules that read this say nothing of it: a rule refuses only what its reader is
 * certain of. The project's own Pug is loaded for the first Pug view and not before.
 */
export async function viewElements(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): Promise<ReadonlyMap<string, readonly WrittenElement[]>> {
  const found = new Map<string, WrittenElement[]>();
  let pug: { readonly loaded: PugCompiler | undefined } | undefined;
  for (const assembly of assemblies) {
    const file = isAbsolute(assembly.view) ? assembly.view : join(root, assembly.view);
    if (leadsOut(root, file)) continue;
    const modules = isStaticView(assembly.renderer) ? [file] : viewModules(root, file).modules;
    const written: WrittenElement[] = [];
    let readable = true;
    for (const module of modules) {
      const loaded =
        assembly.renderer === "pug" ? (pug ??= { loaded: loadPug(root) }).loaded : undefined;
      let elements: readonly ViewElement[] | undefined;
      try {
        elements = await readViewElements(
          module,
          assembly.renderer,
          readInside(root, module),
          loaded,
        );
      } catch {
        elements = undefined;
      }
      if (elements === undefined) {
        readable = false;
        break;
      }
      written.push(...elements.map((element) => ({ file: module, element })));
    }
    if (readable) found.set(assembly.name, written);
  }
  return found;
}
