// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ViewPlacement } from "../assembly/view-placement.js";

/**
 * What the placement rules need to know about an assembly a page may place: nothing of how it
 * renders, only what it answers under and whether it puts the runtime on the page. Boot reads
 * these off the definitions the registry built; `check` reads them off the files, so one set of
 * rules refuses the same page from either.
 */
export interface PlacedAssembly {
  /**
   * What each view's source is known to place, by view. A view absent here places nothing that
   * is known before it renders.
   */
  readonly placements?: Readonly<Record<string, readonly ViewPlacement[]>>;
  /** The views it answers under, `default` among them. */
  readonly views: readonly string[];
  /** Whether a page placing it carries the runtime: a browser half that mounts. */
  readonly browserHalf: boolean;
}
