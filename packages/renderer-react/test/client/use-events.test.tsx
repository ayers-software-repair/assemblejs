// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";
import { EventsContext, useEvents } from "@assemblejs/renderer-react/client";

const Sender = () => {
  const events = useEvents();
  return <p>{typeof events.send}</p>;
};

describe("reaching this assembly's events", () => {
  it("returns the object the assembly was mounted with", () => {
    const { events } = createBus().forAssembly({ id: "1", name: "cart", view: "default" });
    const html = renderToString(
      createElement(EventsContext.Provider, { value: events }, createElement(Sender)),
    );
    expect(html).toBe("<p>function</p>");
  });

  // A hook that quietly answers nothing turns a wiring mistake into a component that silently
  // never hears anything.
  it("throws outside an assembly rather than answering undefined", () => {
    expect(() => renderToString(createElement(Sender))).toThrow(/outside an assembly/);
  });
});
