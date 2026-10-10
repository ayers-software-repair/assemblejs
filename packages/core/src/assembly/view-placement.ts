// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * One assembly a view's source is known to place: a directive a static source holds, or a slot
 * a framework view names.
 */
export interface ViewPlacement {
  readonly name: string;
  /**
   * The view it is placed with. Absent where the source computes it, which only a render
   * knows; whoever reads this then takes it for any view the assembly has.
   */
  readonly view?: string;
}
