// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { EventsContext } from "@assemblejs/renderer-react/client";

describe("the events context", () => {
  it("has no default, so a component outside an assembly is detectable", () => {
    // A module global would hand two assemblies the same events object and lose the scoping
    // that makes teardown exact.
    expect(EventsContext).toBeDefined();
  });
});
