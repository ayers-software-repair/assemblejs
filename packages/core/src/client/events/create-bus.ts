// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Bus } from "./bus.js";
import type { EventHandler } from "./event-handler.js";
import type { EventMessage } from "./event-message.js";
import type { EventScope } from "./event-scope.js";
import type { EventSender } from "./event-sender.js";
import type { Events } from "./events.js";

interface Subscription {
  readonly topic: string;
  readonly handler: EventHandler<never>;
  /** The assembly that subscribed. Carried here so a send can address it without a registry. */
  readonly owner: EventSender;
}

const reaches = (to: EventScope, subscriber: EventSender): boolean => {
  if (to === "all") return true;
  if ("name" in to) return subscriber.name === to.name;
  return subscriber.id === to.id;
};

/**
 * The page's bus.
 *
 * Two assemblies written in different frameworks exchange messages through this and nothing
 * else, which is what makes the mixed-framework page real: the bus belongs to the page rather
 * than to any framework's tree, so neither needs an adapter for the other.
 *
 * `replay` names the topics that keep their last message. Opt-in per topic, because the race it
 * solves is real (a late-hydrating assembly missing an early message) and an unbounded history
 * nobody reads is not.
 */
export function createBus(replay: readonly string[] = []): Bus {
  const subscriptions = new Set<Subscription>();
  const kept = new Map<string, EventMessage<unknown>>();
  const keeps = new Set(replay);
  let seq = 0;

  return {
    get size() {
      return subscriptions.size;
    },

    forAssembly(sender: EventSender) {
      // Held per assembly, so release removes exactly what this assembly added and nothing else.
      const mine = new Set<Subscription>();

      const events: Events = {
        send<P>(topic: string, payload: P, to: EventScope = "all"): EventMessage<P> {
          seq += 1;
          // The sender is stamped from what the runtime knows and is never taken from the
          // caller: a bus where anyone can claim to be anyone is a bus with no addressing.
          const message: EventMessage<P> = { topic, payload, from: sender, to, seq };
          if (keeps.has(topic)) kept.set(topic, message as EventMessage<unknown>);
          // A copy, so a handler that subscribes or unsubscribes while being called cannot
          // change the set being walked underneath it.
          for (const subscription of [...subscriptions]) {
            if (subscription.topic !== topic) continue;
            if (!reaches(to, subscription.owner)) continue;
            (subscription.handler as EventHandler<P>)(message);
          }
          return message;
        },

        on<P>(topic: string, handler: EventHandler<P>): () => void {
          const subscription: Subscription = {
            topic,
            handler: handler as EventHandler<never>,
            owner: sender,
          };
          subscriptions.add(subscription);
          mine.add(subscription);
          return () => {
            subscriptions.delete(subscription);
            mine.delete(subscription);
          };
        },

        last<P>(topic: string): EventMessage<P> | undefined {
          return kept.get(topic) as EventMessage<P> | undefined;
        },
      };

      return {
        events,
        release: () => {
          for (const subscription of mine) subscriptions.delete(subscription);
          mine.clear();
        },
      };
    },
  };
}
