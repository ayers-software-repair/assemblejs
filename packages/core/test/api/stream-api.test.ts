// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { StreamApi } from "@assemblejs/core";

describe("an api that streams", () => {
  it("runs once per connection, sending what it has", async () => {
    const sent: unknown[] = [];
    const ticks: StreamApi = {
      path: "/api/ticks",
      stream: (context) => context.send("tick", 1),
    };
    await ticks.stream({
      query: new URLSearchParams(),
      params: {},
      send: (topic, payload) => sent.push([topic, payload]),
      signal: new AbortController().signal,
    });
    expect(sent).toEqual([["tick", 1]]);
    expect(ticks.method).toBeUndefined();
  });
});
