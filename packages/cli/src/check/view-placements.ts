// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ViewPlacement } from "@assemblejs/core";

/** What a view's source says it places, as far as that can be read without rendering it. */
export interface ViewPlacements {
  /**
   * Each assembly it is known to place, once. Undefined where this source cannot be read for
   * its placements at all, which leaves them to the render.
   */
  readonly placements: readonly ViewPlacement[] | undefined;
  /** Each placement whose name the source computes, as it is written, for a problem to show. */
  readonly unnamed: readonly string[];
}
