// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIMITS,
  NotFound,
  compose,
  defineAssembly,
  defineService,
  localFetch,
} from "@asmjs/core";
import type { Fetch, LogLine } from "@asmjs/core";

describe("a service saying not found", () => {
  it("is an error of its own kind, its message for the log alone", () => {
    const said = new NotFound('no product "nope-99"');
    expect(said).toBeInstanceOf(Error);
    expect(said.name).toBe("NotFound");
    expect(said.message).toBe('no product "nope-99"');
    expect(new NotFound().message).toBe("");
  });

  it("is thrown on by the local transport, unlogged, where any other throw is a failure", async () => {
    const lines: LogLine[] = [];
    const missing = defineAssembly({
      name: "missing",
      views: {
        default: {
          renderer: "html",
          services: [
            defineService({
              name: "item",
              run: () => {
                throw new NotFound();
              },
            }),
          ],
          markup: () => "",
        },
      },
    });
    const fetch = localFetch(
      new Map([["missing", missing]]),
      (line) => lines.push(line),
      DEFAULT_LIMITS,
    );
    const request = {
      name: "missing",
      view: "default",
      id: "a7f3",
      page: "p",
      depth: 1,
      path: [],
      query: new URLSearchParams(),
      params: {},
      headers: {},
      signal: new AbortController().signal,
    };
    await expect(fetch(request)).rejects.toBeInstanceOf(NotFound);
    expect(lines).toEqual([]);
  });

  it("is thrown on by the composer, ahead of a required placement's failure", async () => {
    const said = new NotFound("no such thing");
    const fetch: Fetch = async (request) => {
      if (request.name === "a") throw said;
      return { ok: false, reason: "status", detail: "500", correlationId: "c-b" };
    };
    let counter = 0;
    await expect(
      compose({
        template: '<main><assembly name="a"/><assembly name="b"/></main>',
        plan: { b: { name: "b", view: "default", deadline: 3000, required: true } },
        fetch,
        page: "p1",
        newId: () => `id-${++counter}`,
        now: () => 0,
      }),
    ).rejects.toBe(said);
  });
});
