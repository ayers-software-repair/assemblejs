// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";

export type Line = { sku: string; name: string; note: string; quantity: number; cents: number };
export type Order = {
  id: string;
  placed: string;
  name: string;
  city: string;
  lines: Line[];
  cents: number;
};

// Orders, by an id nobody can guess: the address of an order is the only thing that shows it,
// since nothing of who is asking reaches a page's service. Held in memory.
const orders = new Map<string, Order>();

export const placed = {
  add(order: Omit<Order, "id" | "placed">): Order {
    const kept = { ...order, id: randomUUID(), placed: new Date().toISOString() };
    orders.set(kept.id, kept);
    return kept;
  },
  find: (id: string | undefined): Order | undefined => orders.get(id ?? ""),
};
