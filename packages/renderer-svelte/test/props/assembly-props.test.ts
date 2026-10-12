// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { serverEvents } from "@assemblejs/core/client";
import type { Events } from "@assemblejs/core/client";
import { describe, expect, it } from "vitest";
import type { AssemblyProps } from "@assemblejs/renderer-svelte";

describe("what a Svelte assembly receives", () => {
  it("is its data, by the name every renderer's assembly receives it", () => {
    const props: AssemblyProps<{ total: number }> = { data: { total: 2 }, events: serverEvents() };
    // An author moving between a Svelte assembly and a React one on the same page should not
    // have to learn a second name for the same thing.
    const total: number = props.data.total;
    expect(total).toBe(2);
  });

  it("and the events the renderer hands it, so a view that types its props can read them", () => {
    const props: AssemblyProps = { data: {}, events: serverEvents() };
    // The renderer passes `events` on the server and in the browser alike. A type that left it
    // out made a typed view unable to read what it was handed, and an untyped one read `any`.
    const events: Events = props.events;
    expect(events.last("nothing sent")).toBeUndefined();
  });
});
