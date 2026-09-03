// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@assemblejs/core";

/**
 * What a Svelte assembly receives, as props.
 *
 * The same two names every renderer's assembly receives, deliberately: an author moving between
 * a Svelte assembly and a React one on the same page should not have to learn a second shape
 * for the same two things.
 */
export interface AssemblyProps<D extends JsonObject = JsonObject> {
  readonly data: D;
  readonly children: Readonly<Record<string, string>>;
}
