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
 * `last` is always undefined. A message sent here reaches no one and is dropped, not refused:
 * code that sends while a component initialises (a Svelte component's top-level script) runs
 * again when the component hydrates, and that is the send the page receives.
 */
export function serverEvents(): Events {
  return {
    send: (topic, payload, to = "all") => ({
      topic,
      payload,
      to,
      from: { id: "", name: "", view: "" },
      seq: 0,
    }),
    on: () => () => undefined,
    last: () => undefined,
  };
}
