// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { MountMode } from "@assemblejs/core/client";

describe("the mount modes", () => {
  it("include a mode for shipping no javascript at all", () => {
    const modes: MountMode[] = ["load", "idle", "visible", "none"];
    expect(modes).toContain("none");
  });
});
