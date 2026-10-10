// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { serverEvents } from "@assemblejs/core/client";
import { describe, expect, it } from "vitest";
import type { AssemblyProps } from "@assemblejs/renderer-lit";

describe("what a Lit view receives", () => {
  it("is its data and its events, and nothing of its children", () => {
    const props: AssemblyProps<{ total: number }> = { data: { total: 2 }, events: serverEvents() };
    // A child is placed with slot(), which writes the directive the composer replaces, so no
    // child's markup is ever handed to a view.
    expect(Object.keys(props).sort()).toEqual(["data", "events"]);
  });
});
