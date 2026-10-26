// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect } from "vitest";
import { defineAssembly } from "@asmjs/core";
import type { LogLine } from "@asmjs/core";

// How often the grandchild rendered: what an asker who left must not add to.
const renders = { grand: 0 };

export const grand = defineAssembly({
  name: "grand",
  views: {
    default: {
      renderer: "html",
      markup: () => {
        renders.grand += 1;
        return "<p>grand</p>";
      },
    },
  },
});

/** A child that takes its time and then places the grandchild, for an asker who may have left. */
export const slowkid = defineAssembly({
  name: "slowkid",
  views: {
    default: {
      renderer: "html",
      data: () =>
        new Promise<Record<string, never>>((resolve) => setTimeout(() => resolve({}), 150)),
      markup: () => '<assembly name="grand"></assembly>',
    },
  },
});

/**
 * Asks a listening server for a url twice: once waiting, which composes the grandchild, and
 * once leaving after 30 ms, for which nothing more is composed and the request says so once,
 * in the line `account` names, not once a placement.
 */
export async function askedAndLeft(
  origin: string,
  url: string,
  logged: readonly LogLine[],
  account: string,
): Promise<void> {
  const waited = await fetch(`${origin}${url}`);
  expect(waited.status).toBe(200);
  expect(await waited.text()).toContain("<p>grand</p>");
  expect(renders.grand).toBe(1);
  const leaving = new AbortController();
  const left = fetch(`${origin}${url}`, { signal: leaving.signal }).catch(
    (error: unknown) => error,
  );
  await new Promise((resolve) => setTimeout(resolve, 30));
  leaving.abort();
  expect(await left).toMatchObject({ name: "AbortError" });
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(renders.grand).toBe(1);
  expect(logged.filter((line) => line.message.includes("refused after aborted"))).toEqual([
    expect.objectContaining({ message: expect.stringContaining(account) }),
  ]);
}
