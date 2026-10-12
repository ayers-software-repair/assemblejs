// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { listed } from "./catalogue.js";
import type { Line } from "./orders.js";
import { stock } from "./stock.js";

export type Asked = { sku: string; quantity: number; note: string };
export type Quote = { lines: (Line & { left: number })[]; cents: number; problems: string[] };

/** What a browser sent as a basket, read as data: a list of things and how many, or nothing. */
export const asked = (body: unknown): Asked[] => {
  const lines =
    typeof body === "object" && body !== null && "lines" in body ? body.lines : undefined;
  if (!Array.isArray(lines)) return [];
  return lines.flatMap((line: unknown): Asked[] => {
    if (typeof line !== "object" || line === null) return [];
    const { sku, quantity, note } = line as { sku?: unknown; quantity?: unknown; note?: unknown };
    if (typeof sku !== "string" || typeof quantity !== "number") return [];
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 99) return [];
    return [{ sku, quantity, note: typeof note === "string" ? note.slice(0, 40) : "" }];
  });
};

// A basket lives in a visitor's browser, so what it says of a price is never believed: every
// line is priced here from the catalogue and held to what is on the shelves.
export async function quote(lines: readonly Asked[]): Promise<Quote> {
  const problems: string[] = [];
  const priced = await Promise.all(
    lines.map(async (line) => {
      const product = await listed(line.sku);
      if (product === undefined) {
        problems.push(`${line.sku} is not something we sell`);
        return undefined;
      }
      const left = stock.of(line.sku);
      if (left < line.quantity) {
        problems.push(
          left === 0 ? `${product.name} has sold through` : `Only ${left} of ${product.name} left`,
        );
      }
      return {
        sku: line.sku,
        name: product.name,
        note: line.note,
        quantity: line.quantity,
        cents: product.cents,
        left,
      };
    }),
  );
  const kept = priced.flatMap((line) => (line === undefined ? [] : [line]));
  return {
    lines: kept,
    cents: kept.reduce((sum, line) => sum + line.cents * line.quantity, 0),
    problems,
  };
}
