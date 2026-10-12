// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@assemblejs/core";
import type { Events } from "@assemblejs/core/client";

/**
 * What a Svelte assembly receives, as props.
 *
 * Its data, by the name every renderer's assembly receives it, so an author moving between a
 * Svelte assembly and a React one on the same page has no second name to learn. And its events,
 * which arrive as a prop because that is Svelte's own idiom, on the server and in the browser
 * alike: a view that types its props by this reads both. A child is placed with `slot()`, which
 * writes the directive the composer replaces.
 */
export interface AssemblyProps<D extends JsonObject = JsonObject> {
  readonly data: D;
  readonly events: Events;
}
