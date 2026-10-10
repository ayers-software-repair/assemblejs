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

  // Every placement a request refused for passing its limit shares one id, and so one line.
  it("logs one line for every placement refused past the limit, saying how many", () => {
    const logged: LogLine[] = [];
    const refused: Diagnostic = {
      name: "plain",
      view: "default",
      id: "",
      source: "fallback",
      reason: "too-many",
      correlationId: "c-9",
      ms: 0,
      refused: 9744,
    };
    logFallbacks([answered, refused], 'inside "board"', (line) => logged.push(line));
    expect(logged).toEqual([
      {
        correlationId: "c-9",
        message:
          '9744 placements inside "board" were refused after too-many, the first of them "plain"',
        stack: undefined,
      },
    ]);
  });

  it("walks into what each placement composed, and says which assembly a child sits inside", () => {
    const logged: LogLine[] = [];
    const shell: Diagnostic = {
      ...answered,
      name: "shell",
      children: [
        answered,
        { ...fellBack, children: [{ ...fellBack, name: "price", reason: "cycle" }] },
      ],
    };
    logFallbacks([shell], 'on page "/"', (line) => logged.push(line));
    expect(logged.map((line) => line.message)).toEqual([
      'assembly "cart" on page "/", inside "shell" was answered by the fallback after timeout',
      'assembly "price" on page "/", inside "shell", inside "cart" was answered by the fallback after cycle',
    ]);
  });
});
