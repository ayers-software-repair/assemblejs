// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { EventsContext } from "@assemblejs/renderer-solid/client";

describe("the events context", () => {
  it("has no default, so a component outside an assembly is detectable", () => {
    expect(EventsContext.defaultValue).toBeUndefined();
  });
});
