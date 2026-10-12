// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { h } from "preact";
import { useContext } from "preact/hooks";
import { renderToString } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";
import { EventsContext } from "@assemblejs/renderer-preact/client";

/** What a component finds in the context, each time one is rendered. */
const found: unknown[] = [];
const Probe = () => {
  found.push(useContext(EventsContext));
  return null;
};

describe("the events context", () => {
  it("has no default, so a component outside an assembly is detectable", () => {
    found.length = 0;
    renderToString(h(Probe, {}));
    expect(found).toEqual([undefined]);
  });

  // A module global would hand two assemblies the same events object and lose the scoping
  // that makes teardown exact.
  it("holds each assembly's own events, for the components beneath it and no others", () => {
    found.length = 0;
    const bus = createBus();
    const cart = bus.forAssembly({ id: "1", name: "cart", view: "default" }).events;
    const nav = bus.forAssembly({ id: "2", name: "nav", view: "default" }).events;
    renderToString(
      h(
        "div",
        null,
        h(EventsContext.Provider, { value: cart }, h(Probe, {})),
        h(EventsContext.Provider, { value: nav }, h(Probe, {})),
        h(Probe, {}),
      ),
    );
    expect(found).toHaveLength(3);
    expect(found[0]).toBe(cart);
    expect(found[1]).toBe(nav);
    expect(found[0]).not.toBe(found[1]);
    expect(found[2]).toBeUndefined();
  });
});
