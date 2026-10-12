// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/**
 * One line of a basket as the browser keeps it: what, how many, and a note that tells two
 * lines of one thing apart, the grind of a bag of beans. Never a price.
 */
export type Held = { sku: string; name: string; quantity: number; note: string };

const KEY = "pour-and-grind:basket";

// The basket lives in the visitor's own browser. Nothing of who is asking reaches a page's
// service, so a server cannot keep a basket for "you"; the browser keeps it, and the server
// prices whatever it is shown (src/api/quote.api.ts). Every function here runs in a browser.
export const basket = {
  read(): Held[] {
    try {
      const kept: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (!Array.isArray(kept)) return [];
      return kept
        .filter(
          (line): line is Held =>
            typeof line === "object" &&
            line !== null &&
            typeof (line as Held).sku === "string" &&
            typeof (line as Held).name === "string" &&
            Number.isInteger((line as Held).quantity) &&
            (line as Held).quantity > 0,
        )
        .map((line) => ({ ...line, note: typeof line.note === "string" ? line.note : "" }));
    } catch {
      return [];
    }
  },
  write(lines: readonly Held[]): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines.filter((line) => line.quantity > 0)));
    } catch {
      // A browser that keeps nothing still shows the page; the basket lasts as long as it does.
    }
  },
  /** Adds to a line, or starts one, and answers the basket as it now stands. */
  add(sku: string, name: string, quantity: number, note = ""): Held[] {
    const lines = basket.read();
    const line = lines.find((one) => one.sku === sku && one.note === note);
    if (line === undefined) lines.push({ sku, name, quantity, note });
    else line.quantity = Math.min(99, line.quantity + quantity);
    basket.write(lines);
    return lines;
  },
  count: (lines: readonly Held[]): number => lines.reduce((sum, line) => sum + line.quantity, 0),
};

/** A price as it is written for a visitor. */
export const price = (cents: number): string => `$${(cents / 100).toFixed(2)}`;
