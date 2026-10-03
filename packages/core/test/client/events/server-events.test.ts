// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { serverEvents } from "@assemblejs/core/client";

describe("the events an assembly holds while rendering on the server", () => {
  it("accepts a subscription and never calls it", () => {
    const events = serverEvents();
    let called = false;
    const off = events.on("counted", () => {
      called = true;
    });
    off();
    expect(called).toBe(false);
  });

  it("has no last message, because nothing has been sent", () => {
    expect(serverEvents().last("counted")).toBeUndefined();
  });

  it("refuses to send, by name, because there is no page to send to", () => {
    expect(() => serverEvents().send("counted", { count: 1 })).toThrow(
      /events.send\("counted"\) was called while rendering on the server/,
    );
  });
});
