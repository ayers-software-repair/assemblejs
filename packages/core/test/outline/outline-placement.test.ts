// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { OutlinePlacement } from "@asmjs/core/outline";

describe("how one placement was answered, as an outline is told", () => {
  it("holds its children as the composer's account does, and no reason and no cause", () => {
    const shell: OutlinePlacement = {
      id: "a",
      name: "shell",
      view: "default",
      source: "local",
      ms: 3.2,
      browser: false,
      children: [{ id: "b", name: "cart", view: "default", source: "cache", ms: 0.1 }],
    };
    expect(shell.children?.[0]?.source).toBe("cache");
    expect(Object.keys(shell)).not.toContain("cause");
  });
});
