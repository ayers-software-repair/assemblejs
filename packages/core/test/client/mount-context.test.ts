// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { MountContext } from "@assemblejs/core/client";

describe("what an assembly is told about itself", () => {
  it("is its id, its name and its view, and nothing more", () => {
    const context: MountContext = { id: "a7f3", name: "cart", view: "default" };
    // Nothing about the request crosses to the browser.
    expect(Object.keys(context).sort()).toEqual(["id", "name", "view"]);
  });
});
