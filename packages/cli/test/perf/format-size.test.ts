// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { formatSize } from "@assemblejs/cli";

describe("a byte count as a report reads it", () => {
  it("is bytes under a thousand, and kilobytes to one place above", () => {
    expect(formatSize(0)).toBe("0 B");
    expect(formatSize(999)).toBe("999 B");
    expect(formatSize(1000)).toBe("1.0 kB");
    expect(formatSize(48250)).toBe("48.3 kB");
  });
});
