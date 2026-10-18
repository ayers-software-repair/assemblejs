// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { API_PATH } from "../vocab/api-path.js";
import { RELAY_ROUTE_PREFIX } from "../vocab/relay-route-prefix.js";
import { isOwnRuntime } from "./is-own-runtime.js";
import { runtimeOrigin } from "./runtime-origin.js";

/**
 * The address, from the page, of an api on the server this assembly came from: the path itself
 * on the page's own server, and under the page's server's relay for an assembly placed from
 * another, whose api a browser could not otherwise read. Only an api path is taken.
 */
export function api(path: string): string {
  if (!API_PATH.test(path)) {
    throw new Error(`assemblejs: api("${path}") takes the path of an api, which starts with /api/`);
  }
  const origin = runtimeOrigin.current;
  if (origin === undefined || isOwnRuntime(origin)) return path;
  // Past the guard the origin is a remote's: the runtime was started for it.
  return `${RELAY_ROUTE_PREFIX}/${encodeURIComponent(origin)}${path}`;
}
