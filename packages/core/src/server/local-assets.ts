// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyAssets } from "../assembly/assembly-assets.js";
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { inertSpans } from "../compose/inert-spans.js";
import { ENVELOPE_ELEMENT } from "../vocab/envelope-element.js";

const TAG = new RegExp(`<(/?)${ENVELOPE_ELEMENT}(?:\\s[^>]*)?>`, "gi");
const NAME = /\sdata-name="([^"]*)"/;
const REMOTE = /\sdata-remote=/;

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
    if (assembly !== undefined) {
      js.push(...(assembly.assets?.js ?? []));
      if (!shadowed && assembly.shadow !== true) css.push(...(assembly.assets?.css ?? []));
    }
    open.push({ remote, shadowed: shadowed || assembly?.shadow === true });
  }
  return { css, js };
}
