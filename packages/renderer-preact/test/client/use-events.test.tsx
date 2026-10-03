// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { h } from "preact";
import { renderToString } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";
import { EventsContext, useEvents } from "@assemblejs/renderer-preact/client";

const Sender = () => {
  const events = useEvents();
  return <p>{typeof events.send}</p>;
};

describe("reaching this assembly's events", () => {
  it("returns the object the assembly was mounted with", () => {
    const { events } = createBus().forAssembly({ id: "1", name: "cart", view: "default" });
    expect(renderToString(h(EventsContext.Provider, { value: events }, h(Sender, {})))).toBe(
      "<p>function</p>",
    );
  });

  // A hook that quietly answers nothing turns a wiring mistake into a component that silently
  // never hears anything.
  it("throws outside an assembly rather than answering undefined", () => {
    expect(() => renderToString(h(Sender, {}))).toThrow(/outside an assembly/);
  });
});
