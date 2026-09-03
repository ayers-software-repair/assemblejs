// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

/**
 * What a renderer receives. Children arrive already rendered, as strings, so one conversion
 * happens in the caller and plain HTML nests exactly the way a framework does.
 */
export interface RenderInput {
  /** Whatever loading the view file produced. The renderer knows its own shape. */
  readonly template: unknown;
  readonly data: Readonly<JsonObject>;
  readonly children: Readonly<Record<string, string>>;
  readonly helpers: Readonly<Record<string, unknown>>;
  readonly url: URL;
}
