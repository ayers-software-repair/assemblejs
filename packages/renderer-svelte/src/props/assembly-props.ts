// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@assemblejs/core";

/**
 * What a Svelte assembly receives, as props.
 *
 * Its data, the same name every renderer's assembly receives, so an author moving between a
 * Svelte assembly and a React one on the same page has no second shape to learn. A child is
 * placed with `slot()`, which writes the directive the composer replaces.
 */
export interface AssemblyProps<D extends JsonObject = JsonObject> {
  readonly data: D;
}
