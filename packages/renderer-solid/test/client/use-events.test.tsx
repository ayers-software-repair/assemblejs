// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";
import { EventsContext, useEvents } from "@assemblejs/renderer-solid/client";

describe("reaching this assembly's events", () => {
  it("returns the object the assembly was mounted with", () => {
    const { events } = createBus().forAssembly({ id: "1", name: "cart", view: "default" });
    let seen: unknown;
    createRoot((dispose) => {
      <EventsContext.Provider value={events}>
        {(seen = useEvents()) && null}
      </EventsContext.Provider>;
      dispose();
    });
    expect(seen).toBe(events);
  });

  // A function that quietly answers nothing turns a wiring mistake into a component that
  // silently never hears anything.
  it("throws outside an assembly rather than answering undefined", () => {
    expect(() => createRoot(() => useEvents())).toThrow(/outside an assembly/);
  });
});
