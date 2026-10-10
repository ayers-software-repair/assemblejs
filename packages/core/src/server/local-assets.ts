// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { inertSpans } from "../compose/inert-spans.js";
import { DEFAULT_VIEW } from "../vocab/default-view.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";
import { placedAssemblyOf } from "./placed-assembly-of.js";
import { placedBeneath } from "./placed-beneath.js";

const TAG = new RegExp(`<(/?)${ENVELOPE_ELEMENT}(?:\\s[^>]*)?>`, "gi");
const NAME = /\sdata-name="([^"]*)"/;
const VIEW = /\sdata-view="([^"]*)"/;
const REMOTE = /\sdata-remote=/;
const DEFERRED = /\sdata-defer[\s=>]/;

/**
 * The browser files that markup needs linked around it, for the assemblies of this server it
 * holds: read from the envelopes in the markup itself, at any depth.
 *
 * Read from the markup and not from an account of how it was composed, because the markup is
 * what is served: an answer that came from the cache has no account of the children inside it,
 * and they need their stylesheets all the same.
 *
 * An envelope another server's origin is stamped on is that server's, with everything inside
 * it; what it needs comes from its manifest. A shadow assembly's stylesheets are linked inside
 * its own root, and so are those of every assembly placed inside that root, where a sheet
 * linked around it would not reach them: neither is answered here, and the modules of both are.
 *
 * A deferred placement is served empty and filled by the browser, and its children arrive with
 * that answer. So the page links for them now, from what the deferred view's source is known to
 * place at any depth, what it would otherwise have read from their envelopes.
 */
export function localAssets(
  html: string,
  assemblies: ReadonlyMap<string, AssemblyDefinition>,
): AssemblyAssets {
  const css: string[] = [];
  const js: string[] = [];
  const inert = inertSpans(html);
  // One entry per open envelope: whether it is another server's, and whether what is inside it
  // sits in a shadow root of this server's.
  const open: Array<{ readonly remote: boolean; readonly shadowed: boolean }> = [];
  TAG.lastIndex = 0;
  for (const tag of html.matchAll(TAG)) {
    if (inert(tag.index)) continue;
    if (tag[1] === "/") {
      open.pop();
      continue;
    }
    const around = open.at(-1);
    const remote = around?.remote === true || REMOTE.test(tag[0]);
    const assembly = remote ? undefined : assemblies.get(NAME.exec(tag[0])?.[1] ?? "");
    const shadowed = around?.shadowed === true;
    const link = (one: AssemblyDefinition | undefined, hidden: boolean): boolean => {
      js.push(...(one?.assets?.js ?? []));
      if (!hidden && one?.shadow !== true) css.push(...(one?.assets?.css ?? []));
      return hidden || one?.shadow === true;
    };
    if (assembly !== undefined) {
      const hidden = link(assembly, shadowed);
      if (DEFERRED.test(tag[0])) {
        placedBeneath(
          { name: assembly.name, view: VIEW.exec(tag[0])?.[1] ?? DEFAULT_VIEW },
          (name) => {
            const placed = assemblies.get(name);
            return placed === undefined ? undefined : placedAssemblyOf(placed);
          },
          (placed, above) => link(assemblies.get(placed.name), above),
          hidden,
        );
      }
    }
    open.push({ remote, shadowed: shadowed || assembly?.shadow === true });
  }
  return { css, js };
}
