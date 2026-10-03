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

  it("drops a message sent while rendering, which hydration sends again", () => {
    const message = serverEvents().send("ready", { at: 1 });
    expect(message.topic).toBe("ready");
    expect(message.to).toBe("all");
    expect(message.from.id).toBe("");
  });
});
