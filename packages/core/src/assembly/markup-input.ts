// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";

/**
 * What producing an assembly's markup is given.
 *
 * A view is never handed a child. It places one by writing the directive in its markup, and the
 * composer puts the child's envelope where the directive stood once the view has rendered, so
 * plain HTML, a template and a framework view all nest the same way.
 */
export interface MarkupInput {
  readonly data: Readonly<JsonObject>;
  /**
   * The placement's id, as its envelope carries it and the browser half is mounted with: a
   * renderer whose hydration keys must not collide with another island's prefixes them with it.
   */
  readonly id?: string;
}
