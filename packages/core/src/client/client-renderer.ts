// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "../json/json-object.js";
import type { MountContext } from "./mount-context.js";
import type { MountHandle } from "./mount-handle.js";

/**
 * The browser half of a renderer, and the whole cross-framework contract. The element handed to
 * mount is already resolved: an adapter never looks its own root up, because a lookup that
 * misses fails silently.
 */
export interface ClientRenderer {
  mount(element: Element, data: JsonObject, context: MountContext): MountHandle;
}
