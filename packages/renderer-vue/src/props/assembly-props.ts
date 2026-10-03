// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@assemblejs/core";

/**
 * What a Vue assembly receives.
 *
 * `children` are already-rendered HTML by contract, keyed by placement name, which is the one
 * conversion the whole design makes: it happens in the caller, once, so plain HTML nests inside
 * Vue exactly the way Vue nests inside Markdown.
 */
export interface AssemblyProps<D extends JsonObject = JsonObject> {
  readonly data: D;
  readonly children: Readonly<Record<string, string>>;
}
