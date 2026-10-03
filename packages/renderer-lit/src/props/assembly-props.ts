// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@assemblejs/core";
import type { Events } from "@assemblejs/core/client";

/**
 * What a Lit view receives.
 *
 * `children` are already-rendered HTML by contract, keyed by placement name, which is the one
 * conversion the whole design makes: it happens in the caller, once, so plain HTML nests inside
 * Lit exactly the way Lit nests inside Markdown. The events arrive as a prop, as a template
 * function has no context to read them from; a view hands them to its elements as a property.
 */
export interface AssemblyProps<D extends JsonObject = JsonObject> {
  readonly data: D;
  readonly children: Readonly<Record<string, string>>;
  readonly events: Events;
}
