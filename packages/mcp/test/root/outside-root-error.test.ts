// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OutsideRootError } from "@assemblejs/mcp";

describe("refusing a path outside the project", () => {
  it("says what was attempted and what the root is", () => {
    const error = new OutsideRootError("../../etc/passwd", "/home/dev/app");
    expect(error).toBeInstanceOf(Error);
    expect(error.attempted).toBe("../../etc/passwd");
    expect(error.root).toBe("/home/dev/app");
  });
});
