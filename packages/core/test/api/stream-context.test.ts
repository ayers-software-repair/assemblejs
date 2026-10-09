// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { StreamContext } from "@assemblejs/core";

describe("what a stream is given", () => {
  it("is the request's query and parameters, a send, and the connection's signal", () => {
    const controller = new AbortController();
    const context: StreamContext = {
      query: new URLSearchParams("room=a"),
      params: { id: "1" },
      send: () => undefined,
      signal: controller.signal,
    };
    controller.abort();
    expect(context.signal.aborted).toBe(true);
    expect(context.query.get("room")).toBe("a");
  });
});
