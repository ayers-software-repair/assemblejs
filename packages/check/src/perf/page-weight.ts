// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssetWeight } from "./asset-weight.js";

/**
 * What one page sends a visitor: before anything mounts, the document, its stylesheets and its
 * scripts with what they import; then, as the assemblies mount, their modules with what those
 * import. Each file counts once, from the page's own origin; another origin's is named.
 */
export interface PageWeight {
  readonly route: string;
  /** Where a route with a parameter was weighed. */
  readonly address?: string;
  readonly document: AssetWeight;
  readonly styles: AssetWeight;
  readonly scripts: AssetWeight;
  /** What the assemblies mounted on the page fetch as they mount. */
  readonly mount: AssetWeight;
  /** How many assemblies `mount` weighs. */
  readonly assemblies: number;
  readonly total: AssetWeight;
  /** Files the page links from another origin, which are not weighed. */
  readonly elsewhere: readonly string[];
  /** Assemblies the page answered with their fallback, by name. */
  readonly fellBack: readonly string[];
}
