// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { API_PATH } from "../vocab/api-path.js";
import { RELAY_ROUTE_PREFIX } from "../vocab/relay-route-prefix.js";

/**
 * The address on a remote that a relay request asks for, or undefined when it asks for anything
 * but an api of that origin. The path after the origin segment is taken as the visitor sent it,
 * then resolved the way the remote's server will read it, so a dot segment or a backslash cannot
 * climb out of `/api` and a leading `//` cannot name another host.
 */
export function relayedUrl(origin: string, requestUrl: string): URL | undefined {
  const rest = requestUrl.slice(requestUrl.indexOf("/", RELAY_ROUTE_PREFIX.length + 1));
  let target: URL;
  try {
    target = new URL(rest, origin);
  } catch {
    return undefined;
  }
  return target.origin === origin && API_PATH.test(target.pathname) ? target : undefined;
}
