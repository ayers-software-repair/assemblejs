// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ViewPlacement } from "@asmjs/core";

/** What a view's source says it places, as far as that can be read without rendering it. */
export interface ViewPlacements {
  /**
   * Each assembly it is known to place, once. Undefined where this source cannot be read for
   * its placements at all, which leaves them to the render.
   */
  readonly placements: readonly ViewPlacement[] | undefined;
  /** Each placement whose name the source computes, as it is written, for a problem to show. */
  readonly unnamed: readonly string[];
  /**
   * The slots written inside an element's own `render`, each shown as the view writes it: a child
   * placed there stands in the element's shadow root, which the composer refuses, so none is a
   * placement of the view's.
   */
  readonly shadowed?: readonly string[];
}
