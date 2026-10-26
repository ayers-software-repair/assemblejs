// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { StreamContext } from "@asmjs/core";

// What is on the shelves, kept by the shop: the catalogue says what a thing is, the shop knows
// how many it has. Held in memory, as a showcase holds it; a real shop would ask a database.
const levels = new Map<string, number>([
  ["kb-guji-250", 14],
  ["kb-huila-250", 22],
  ["kb-gayo-250", 3],
  ["kb-decaf-250", 9],
  ["br-dripper-02", 6],
  ["br-press-600", 0],
  ["br-kettle-900", 4],
  ["br-scale-01", 11],
  ["gr-hand-38", 2],
  ["gr-flat-64", 1],
  ["gr-brush", 40],
  ["gr-bellows", 17],
]);
const listening = new Set<StreamContext["send"]>();

export const stock = {
  of: (sku: string): number => levels.get(sku) ?? 0,
  all: (): { sku: string; left: number }[] => [...levels].map(([sku, left]) => ({ sku, left })),
  /** Sets a level and tells every page that is listening. */
  set(sku: string, left: number): void {
    levels.set(sku, Math.max(0, Math.floor(left)));
    for (const send of listening) send("stock:changed", { sku, left: stock.of(sku) });
  },
  listen(send: StreamContext["send"], signal: AbortSignal): void {
    listening.add(send);
    signal.addEventListener("abort", () => listening.delete(send));
  },
};
