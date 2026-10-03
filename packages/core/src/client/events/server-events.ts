// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Events } from "./events.js";

/**
 * The events object an assembly holds while it renders on the server, where there is no page and
 * no bus yet. A component reads it the way it reads its own in the browser, so the same component
 * renders on both sides without asking which one it is on.
 *
 * Nothing can be heard: a subscription is accepted and never called, because the code that
 * subscribes (an effect) does not run during a server render anyway. Nothing has been sent, so
 * `last` is always undefined. Sending refuses, by name: a message sent while rendering would
 * reach no one, and a render that relies on one is a render that is wrong in the browser too.
 */
export function serverEvents(): Events {
  return {
    send: (topic) => {
      throw new Error(
        `events.send("${topic}") was called while rendering on the server, where there is no page to send to. Send from an event handler or an effect, which run in the browser.`,
      );
    },
    on: () => () => undefined,
    last: () => undefined,
  };
}
