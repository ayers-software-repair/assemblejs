// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { EventHandler } from "./event-handler.js";
import type { EventMessage } from "./event-message.js";
import type { EventScope } from "./event-scope.js";

/**
 * What one assembly holds. The public surface is this typed object; raw event dispatch is never
 * the API, because a string channel on a shared object is a collision nobody can see coming.
 */
export interface Events {
  send<P>(topic: string, payload: P, to?: EventScope): EventMessage<P>;
  /** Returns the unsubscribe. The runtime also calls it on unmount. */
  on<P>(topic: string, handler: EventHandler<P>): () => void;
  /** The last message on a topic, when that topic was declared to keep one. */
  last<P>(topic: string): EventMessage<P> | undefined;
}
