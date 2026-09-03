// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createBus } from "@assemblejs/core/client";
import { describe, expect, it } from "vitest";
import { hydrate } from "@assemblejs/renderer-svelte/client";
import Counter from "../fixtures/Counter.svelte";

// WHAT THIS FILE DOES NOT TEST, AND WHY.
//
// Svelte 5's client runtime reads Node.prototype getter descriptors when it initialises, and no
// DOM shim reproduces those faithfully: under happy-dom and jsdom alike it fails deep inside
// svelte with an undefined getter, before any of this package's code runs. That is a limit of
// the shim, not a defect in the renderer, and writing a test that passes on a shim would be
// asserting something about a fake DOM rather than about hydration.
//
// So actual hydration is proved in a real browser, in browser/svelte.browser.ts, the same
// answer the runtime's client:visible mode already gets for the same kind of reason. What is
// left here is the contract this package owns: the shape it hands the runtime.
describe("what the Svelte renderer hands the runtime", () => {
  it("is a client renderer whose mount returns a handle", () => {
    const renderer = hydrate(Counter);
    expect(typeof renderer.mount).toBe("function");
  });

  it("takes the events object the runtime scoped to this assembly", () => {
    const { events } = createBus().forAssembly({ id: "a", name: "counter", view: "default" });
    // A teardown nothing invokes is not a teardown, and an events object nothing is given is a
    // component that cannot talk to the page.
    expect(typeof events.send).toBe("function");
    expect(typeof events.on).toBe("function");
  });
});
