// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import { CONTRACT_VERSION } from "../contract/contract-version.js";
import type { AssemblyManifest } from "./assembly-manifest.js";

/**
 * The manifest, built by naming every field that goes in.
 *
 * Nothing server-private can appear here because nothing is copied wholesale: no template, no
 * data function, no filesystem path, no configuration. The predecessor built its manifest by
 * removing three fields from its internal object and shipping the rest, which is the opposite
 * rule and leaks by default every time the internal object grows.
 */
export function buildManifest(
  definition: AssemblyDefinition,
  view: string,
  version: string,
): AssemblyManifest {
  const declared = definition.views[view];
  if (declared === undefined) {
    throw new Error(`assembly "${definition.name}" has no view "${view}"`);
  }
  return {
    contract: CONTRACT_VERSION,
    name: definition.name,
    view,
    version,
    views: Object.keys(definition.views),
    renderer: declared.renderer,
    assets: { css: [], js: [] },
    public: true,
  };
}
