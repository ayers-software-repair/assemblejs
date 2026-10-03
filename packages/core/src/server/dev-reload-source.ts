// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { DEV_RELOAD_STREAM } from "../vocab/dev-reload-stream.js";

/**
 * The browser side of reloading in development, served as a file because the page's policy runs
 * no inline script. The page links it with the boot of the server that rendered the page; `dev`
 * restarts the server after every rebuild, the event source reconnects to the new one, hears a
 * different boot, and the page reloads. A page rendered by a server that has since restarted
 * reloads on its first connection.
 */
export const DEV_RELOAD_SOURCE = `const boot = new URL(import.meta.url).searchParams.get("boot");
const source = new EventSource(${JSON.stringify(DEV_RELOAD_STREAM)});
source.onmessage = (event) => {
  if (JSON.parse(event.data).payload !== boot) location.reload();
};
`;
