// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@assemblejs/core";
import type { Events } from "@assemblejs/core/client";

/**
 * What a Lit view receives.
 *
 * Its data and its events, and nothing of its children: a view places a child with `slot()`,
 * which writes the directive the composer replaces. The events arrive as a prop, as a template
 * function has no context to read them from; a view hands them to its elements as a property.
 */
export interface AssemblyProps<D extends JsonObject = JsonObject> {
  readonly data: D;
  readonly events: Events;
}
