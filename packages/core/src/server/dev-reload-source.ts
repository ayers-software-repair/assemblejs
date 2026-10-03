// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEV_RELOAD_STREAM } from "../vocab/dev-reload-stream.js";

/**
 * The browser side of reloading in development, served as a file because the page's policy runs
 * no inline script. It remembers the boot of the server it first heard from; `dev` restarts the
 * server after every rebuild, the event source reconnects to the new one, hears a different boot,
 * and the page reloads.
 */
export const DEV_RELOAD_SOURCE = `let boot;
const source = new EventSource(${JSON.stringify(DEV_RELOAD_STREAM)});
source.onmessage = (event) => {
  const next = JSON.parse(event.data).payload;
  if (boot !== undefined && next !== boot) location.reload();
  boot = next;
};
`;
