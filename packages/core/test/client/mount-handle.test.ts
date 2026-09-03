// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { MountHandle } from "@assemblejs/core/client";

describe("a mount handle", () => {
  it("is what the runtime calls to tear an assembly down", () => {
    let torn = false;
    const handle: MountHandle = {
      unmount: () => {
        torn = true;
      },
    };
    handle.unmount();
    expect(torn).toBe(true);
  });
});
