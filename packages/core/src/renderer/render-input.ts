// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

/**
 * What a renderer receives. Never a child: a view places one by writing the directive, and the
 * composer puts the child there once the view has rendered.
 */
export interface RenderInput {
  /** Whatever loading the view file produced. The renderer knows its own shape. */
  readonly template: unknown;
  readonly data: Readonly<JsonObject>;
  readonly helpers: Readonly<Record<string, unknown>>;
  readonly url: URL;
}
