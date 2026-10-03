// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineApi, isStreamApi } from "@assemblejs/core";

describe("declaring an api", () => {
  it("returns what it was given, its handler's context typed", async () => {
    const time = defineApi({ path: "/api/time", handle: (context) => ({ ok: context.params }) });
    if (isStreamApi(time)) throw new Error("declared with a handler");
    expect(time.path).toBe("/api/time");
    expect(
      await time.handle({ query: new URLSearchParams(), params: {}, body: undefined }),
    ).toEqual({ ok: {} });
  });

  it("returns a stream as it was given, its context typed", async () => {
    const sent: string[] = [];
    const ticks = defineApi({ path: "/api/ticks", stream: (context) => context.send("tick", 1) });
    if (!isStreamApi(ticks)) throw new Error("declared with a stream");
    await ticks.stream({
      query: new URLSearchParams(),
      params: {},
      send: (topic) => sent.push(topic),
      signal: new AbortController().signal,
    });
    expect(sent).toEqual(["tick"]);
  });

  it("refuses at the type level what is not an api", () => {
    const handle = () => null;
    // @ts-expect-error A misspelt method would otherwise mount the route as GET.
    defineApi({ path: "/a", mehtod: "POST", handle });
    // @ts-expect-error A definition with both a handler and a stream is neither.
    defineApi({ path: "/b", handle, stream: () => undefined });
    expect(true).toBe(true);
  });
});
