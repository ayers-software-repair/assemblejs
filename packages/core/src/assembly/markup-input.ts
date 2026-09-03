// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

/**
 * What producing an assembly's markup is given.
 *
 * Children arrive already rendered, as strings: one conversion, in the caller, so plain HTML
 * nests exactly the way a framework does.
 */
export interface MarkupInput {
  readonly data: Readonly<JsonObject>;
  readonly children: Readonly<Record<string, string>>;
}
