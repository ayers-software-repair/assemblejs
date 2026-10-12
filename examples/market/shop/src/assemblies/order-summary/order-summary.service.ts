// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineService } from "@assemblejs/core";
import { placed } from "../../shop/orders.js";

const price = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

// What the view is given: the order as a page shows it, or that there is none of that id.
type Order =
  | { found: false }
  | {
      found: true;
      short: string;
      name: string;
      city: string;
      placed: string;
      total: string;
      lines: { name: string; quantity: number; sum: string }[];
    };

// The order the page's route names (`/orders/:id`). The id is the whole of the key: whoever
// holds the address sees the order, and nobody else can find it.
export default defineService({
  name: "order",
  run: ({ params }): Order => {
    const order = placed.find(params["id"]);
    if (order === undefined) return { found: false };
    return {
      found: true,
      short: order.id.slice(0, 8),
      name: order.name,
      city: order.city,
      placed: new Date(order.placed).toUTCString(),
      total: price(order.cents),
      lines: order.lines.map((line) => ({
        name: line.note === "" ? line.name : `${line.name}, ${line.note.toLowerCase()}`,
        quantity: line.quantity,
        sum: price(line.cents * line.quantity),
      })),
    };
  },
});
