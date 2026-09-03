// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { IslandPayload } from "../island/island-payload.js";
import type { IslandSource } from "./island-source.js";

/**
 * The allowlist projection, built by naming every field that goes in.
 *
 * Deliberately not a spread and not a copy: an object that is spread carries whatever it was
 * given, so the day someone puts the request on the server's context is the day the request
 * reaches the browser. Six names is the entire mechanism.
 */
export function projectIsland(source: IslandSource): IslandPayload {
  return {
    id: source.id,
    name: source.name,
    view: source.view,
    renderer: source.renderer,
    data: source.data,
    deferred: source.deferred ?? false,
  };
}
