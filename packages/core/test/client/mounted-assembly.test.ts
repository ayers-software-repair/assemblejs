// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { MountedAssembly } from "@assemblejs/core/client";

describe("a mounted assembly", () => {
  it("holds the handle that tears it down", () => {
    let torn = false;
    const assembly: MountedAssembly = {
      id: "a7f3",
      name: "cart",
      view: "default",
      element: document.createElement("assembly-root"),
      handle: { unmount: () => (torn = true) },
    };
    assembly.handle.unmount();
    expect(torn).toBe(true);
  });
});
