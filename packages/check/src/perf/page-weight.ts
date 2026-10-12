// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssetWeight } from "./asset-weight.js";

/**
 * What one page sends a visitor before anything mounts: the document, the stylesheets it links,
 * and the scripts it links with everything a module among them imports before it runs, each
 * from the page's own origin. The chunks an assembly loads when it mounts are not in it, and
 * neither is a file from another origin, which it names.
 */
export interface PageWeight {
  readonly route: string;
  readonly document: AssetWeight;
  readonly styles: AssetWeight;
  readonly scripts: AssetWeight;
  /** Files the page links from another origin, which are not weighed. */
  readonly elsewhere: readonly string[];
  /** Assemblies the page answered with their fallback, by name. */
  readonly fellBack: readonly string[];
}
