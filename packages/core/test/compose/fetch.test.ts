// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AssemblyRequest, Fetch } from "@assemblejs/core";

const request = (): AssemblyRequest => ({
  name: "cart",
  view: "default",
  id: "a7f3",
  page: "p1",
  depth: 1,
  path: ["p1"],
  query: new URLSearchParams(),
  headers: {},
  signal: AbortSignal.timeout(1000),
});

describe("the fetch contract", () => {
  it("answers with a result and never by throwing", async () => {
    const local: Fetch = async () => ({ ok: true, html: "<p>cart</p>", source: "local" });
    const remote: Fetch = async () => ({
      ok: false,
      reason: "transport",
      detail: "connection refused",
      correlationId: "c-2",
    });
    // The same signature answers for both transports, which is what lets an assembly move.
    const results = await Promise.all([local(request()), remote(request())]);
    expect(results.map((r) => r.ok)).toEqual([true, false]);
  });
});
