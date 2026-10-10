// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { logFallbacks } from "@assemblejs/core";
import type { Diagnostic, LogLine } from "@assemblejs/core";

const answered: Diagnostic = { name: "hello", view: "default", id: "i-1", source: "local", ms: 1 };
const fellBack: Diagnostic = {
  name: "cart",
  view: "default",
  id: "i-2",
  source: "fallback",
  reason: "timeout",
  correlationId: "c-7",
  ms: 3000,
};

describe("logging the placements that fell back", () => {
  it("logs each one against the id its envelope carries, saying what covered for it and why", () => {
    const logged: LogLine[] = [];
    logFallbacks([answered, fellBack], 'on page "/cart"', (line) => logged.push(line));
    expect(logged).toEqual([
      {
        correlationId: "c-7",
        message: 'assembly "cart" on page "/cart" was answered by the fallback after timeout',
        stack: undefined,
      },
    ]);
  });

  it("says nothing for a placement its own content answered", () => {
    const logged: LogLine[] = [];
    logFallbacks([answered], 'on page "/"', (line) => logged.push(line));
    expect(logged).toEqual([]);
  });

  it("names the rung that answered, the cache included, and mints an id when none came", () => {
    const logged: LogLine[] = [];
    const held: Diagnostic = { ...answered, source: "cache", reason: "status" };
    logFallbacks([held], 'on page "/"', (line) => logged.push(line));
    expect(logged[0]?.message).toBe(
      'assembly "hello" on page "/" was answered by the cache after status',
    );
    expect(logged[0]?.correlationId).toMatch(/^[0-9a-f]{8}$/);
  });
});
