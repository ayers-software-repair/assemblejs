// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineApi } from "@assemblejs/core";
import { placed } from "../shop/orders.js";
import { FULFILMENT } from "../shop/origins.js";
import { asked, quote } from "../shop/quote.js";
import { stock } from "../shop/stock.js";

const text = (value: unknown, most: number): string =>
  typeof value === "string" ? value.trim().slice(0, most) : "";

// What placing an order answers: the order's id, or why it was not placed. Said as a type, as
// an api that answers one of two shapes has to say which two they are.
type Answer = { ok: true; id: string } | { ok: false; problems: string[] };

// Places an order: priced again here, held to the shelves, taken off them, and handed to the
// fulfilment team's server. An api answers data and nothing else, so a refusal is data too:
// `{ ok: false, problems }`, which the form shows.
export default defineApi({
  path: "/api/orders",
  method: "POST",
  handle: async ({ body }): Promise<Answer> => {
    const sent = (typeof body === "object" && body !== null ? body : {}) as {
      [key: string]: unknown;
    };
    const name = text(sent["name"], 80);
    const city = text(sent["city"], 80);
    const priced = await quote(asked(body));
    const problems = [...priced.problems];
    if (name === "") problems.push("Tell us who the parcel is for");
    if (city === "") problems.push("Tell us where it is going");
    if (priced.lines.length === 0) problems.push("The basket is empty");
    if (problems.length > 0) return { ok: false, problems };

    const order = placed.add({
      name,
      city,
      cents: priced.cents,
      lines: priced.lines.map(({ sku, name: title, note, quantity, cents }) => ({
        sku,
        name: title,
        note,
        quantity,
        cents,
      })),
    });
    for (const line of order.lines) stock.set(line.sku, stock.of(line.sku) - line.quantity);
    // The fulfilment team is told, and not waited on for long: an order is placed whether or
    // not their server is up, and their page says what it knows.
    await fetch(`${FULFILMENT}/api/shipments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order: order.id, city, parcels: order.lines.length }),
      signal: AbortSignal.timeout(800),
    }).catch(() => undefined);
    return { ok: true, id: order.id };
  },
});
