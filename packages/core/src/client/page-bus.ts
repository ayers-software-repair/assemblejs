// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Bus } from "./events/bus.js";
import { createBus } from "./events/create-bus.js";
import { isOwnRuntime } from "./is-own-runtime.js";
import { PAGE_BUS_KEY } from "./page-bus-key.js";
import { readEventOrigins } from "./read-event-origins.js";

/**
 * The bus a runtime started from this origin uses. The page's own runtime and each remote server
 * the page's head admits share one bus, kept on `globalThis` so every bundle on the page finds it;
 * a remote the page does not admit gets a bus of its own, kept nowhere. The replay topics of
 * whichever runtime asks are kept on the shared bus, so they hold whichever runtime made it.
 */
export function pageBus(origin: string | undefined, replay: readonly string[] = []): Bus {
  const joins =
    isOwnRuntime(origin) ||
    (origin !== undefined && readEventOrigins(document.head).includes(origin));
  if (!joins) return createBus(replay);
  const kept = globalThis as Record<symbol, Bus | undefined>;
  const bus = (kept[PAGE_BUS_KEY] ??= createBus(replay));
  for (const topic of replay) bus.keep(topic);
  return bus;
}
