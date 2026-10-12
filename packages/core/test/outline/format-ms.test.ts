// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { formatMs } from "@assemblejs/core/outline";

describe("a length of time, in the fewest words that say it", () => {
  it("is tenths under ten milliseconds, whole ones under a second, and seconds from there", () => {
    expect(formatMs(0.04)).toBe("0 ms");
    expect(formatMs(0.26)).toBe("0.3 ms");
    expect(formatMs(9.94)).toBe("9.9 ms");
    expect(formatMs(48.6)).toBe("49 ms");
    expect(formatMs(999.4)).toBe("999 ms");
    expect(formatMs(1240)).toBe("1.2 s");
  });
});
