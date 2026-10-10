// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@assemblejs/core";

/**
 * What a Preact assembly receives.
 *
 * Its data, and nothing of its children: a view places a child with `Slot`, which writes the
 * directive the composer replaces, so no child's markup ever passes through Preact.
 */
export interface AssemblyProps<D extends JsonObject = JsonObject> {
  readonly data: D;
}
