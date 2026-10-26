// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RequiredFailure, failedSettling } from "@asmjs/core";

const placement = { name: "cart", view: "wide" };

describe("a placement whose settling itself threw", () => {
  it("stands as an empty envelope marked failed with the id its cause is logged against", () => {
    const settled = failedSettling(placement, undefined, "c-3", new Error("the cache broke"));
    expect(settled.html).toBe(
      '<assembly-root data-name="cart" data-id="c-3" data-view="wide" data-renderer="" data-failed="c-3">' +
        '<script type="application/json" data-assembly="c-3">' +
        '{"id":"c-3","name":"cart","view":"wide","renderer":"","data":{},"deferred":false}</script>' +
        "</assembly-root>",
    );
    expect(settled.diagnostic).toEqual({
      name: "cart",
      view: "wide",
      id: "c-3",
      source: "fallback",
      reason: "invalid",
      correlationId: "c-3",
      cause: "the cache broke",
      ms: 0,
    });
  });

  it("shows the fallback the page declared, and says what was thrown when it was no error", () => {
    const plan = { name: "cart", view: "wide", deadline: 3000, fallback: "<p>later</p>" };
    const settled = failedSettling(placement, plan, "c-4", "nope");
    expect(settled.html).toContain('data-failed="c-4"><p>later</p><script');
    expect(settled.diagnostic.cause).toBe("nope");
  });

  it("fails the page for a placement declared required, as any failure of its does", () => {
    const plan = { name: "cart", view: "wide", deadline: 3000, required: true };
    expect(() => failedSettling(placement, plan, "c-5", new Error("x"))).toThrow(RequiredFailure);
  });
});
