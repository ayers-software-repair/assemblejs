// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { connectStream } from "./connect-stream.js";
import type { Bus } from "./events/bus.js";
import { readStreamUrl } from "./read-stream-url.js";
import type { StartOptions } from "./start-options.js";
import type { StreamSource } from "./stream-source.js";

/**
 * Opens the page's one stream onto its bus, answering the close, or undefined when there is none
 * to open: the one the runtime was started with, or else the one the page names in its head,
 * which only the page's own runtime opens and never a remote's, so a page is one connection.
 */
export function openPageStream(
  options: StartOptions,
  bus: Bus,
  open?: (url: string) => StreamSource,
): (() => void) | undefined {
  const own =
    options.origin === undefined ||
    (typeof location !== "undefined" && options.origin === location.origin);
  const url = options.stream ?? (own ? readStreamUrl(document) : undefined);
  return url === undefined ? undefined : connectStream(url, bus, open);
}
