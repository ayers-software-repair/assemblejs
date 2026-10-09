// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ApiDefinition } from "../api/api-definition.js";
import { isStreamApi } from "../api/is-stream-api.js";

/**
 * The paths a page may name as its stream: those of the streaming apis, without a parameter,
 * as a page's runtime opens its stream by the path as written and a path with a parameter is
 * one no page can name.
 */
export function streamPaths(apis: readonly ApiDefinition[]): ReadonlySet<string> {
  return new Set(
    apis
      .filter(isStreamApi)
      .map((api) => api.path)
      .filter((path) => !path.includes(":")),
  );
}
