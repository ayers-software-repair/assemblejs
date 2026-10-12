// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CachedContent } from "./cached-content.js";
import type { Diagnostic } from "./diagnostic.js";
import { identity } from "./identity.js";

/**
 * The assemblies whose content an answer holds, read off the account of what the answering
 * assembly's view placed: each once, at any depth. A placement the browser fills later is not
 * among them, since the answer holds only its place and its own address decides for it.
 */
export function heldAssemblies(
  nested: readonly Diagnostic[] | undefined,
): NonNullable<CachedContent["holds"]> {
  const held = new Map<string, { readonly name: string; readonly view: string }>();
  const walk = (placed: readonly Diagnostic[]): void => {
    for (const { name, view, source, children } of placed) {
      if (source !== "deferred") held.set(identity(name, view), { name, view });
      if (children !== undefined) walk(children);
    }
  };
  walk(nested ?? []);
  return [...held.values()];
}
