// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
/** A product a visitor has looked at, as the browser remembers it. */
export type Viewed = { sku: string; name: string };

const KEY = "pour-and-grind:viewed";

// The last few products this browser was shown, newest first. Kept in the browser for the
// reason the basket is.
export const viewed = {
  read(): Viewed[] {
    try {
      const kept: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      return Array.isArray(kept)
        ? kept.filter(
            (one): one is Viewed =>
              typeof one === "object" &&
              one !== null &&
              typeof (one as Viewed).sku === "string" &&
              typeof (one as Viewed).name === "string",
          )
        : [];
    } catch {
      return [];
    }
  },
  note(sku: string, name: string): void {
    try {
      const rest = viewed.read().filter((one) => one.sku !== sku);
      localStorage.setItem(KEY, JSON.stringify([{ sku, name }, ...rest].slice(0, 4)));
    } catch {
      // Nothing is remembered where nothing may be kept.
    }
  },
};
