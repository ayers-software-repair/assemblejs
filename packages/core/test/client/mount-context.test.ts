// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createBus } from "@assemblejs/core/client";
import type { MountContext } from "@assemblejs/core/client";

describe("what an assembly is told about itself", () => {
  it("is its identity plus the events object scoped to it", () => {
    const { events } = createBus().forAssembly({ id: "a7f3", name: "cart", view: "default" });
    const context: MountContext = { id: "a7f3", name: "cart", view: "default", events };
    expect(Object.keys(context).sort()).toEqual(["events", "id", "name", "view"]);
    // Nothing about the request crosses to the browser; the identity and the bus are all there is.
    expect(Object.keys(context)).not.toContain("headers");
  });
});
