// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { CATALOG } from "./origins.js";

/** A product as the catalogue team's api answers it; the shop reads only what it sells by. */
export type Listed = {
  sku: string;
  name: string;
  cents: number;
  category: string;
  mark: string;
  tone: string;
};

// The catalogue is another team's server. It is asked over HTTP, server to server, and never
// waited on for long: a shop that cannot reach it says so and stays up.
const ask = async <T>(path: string): Promise<T | undefined> => {
  try {
    const answer = await fetch(`${CATALOG}${path}`, { signal: AbortSignal.timeout(800) });
    return answer.ok ? ((await answer.json()) as T) : undefined;
  } catch {
    return undefined;
  }
};

export const listed = async (sku: string): Promise<Listed | undefined> =>
  (await ask<Listed | null>(`/api/products/${encodeURIComponent(sku)}`)) ?? undefined;

export const search = async (words: string): Promise<Listed[]> =>
  (await ask<Listed[]>(`/api/products?q=${encodeURIComponent(words)}`)) ?? [];
