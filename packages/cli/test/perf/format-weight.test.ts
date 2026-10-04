// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { formatWeight } from "@assemblejs/cli";

describe("a page's weight as one line", () => {
  it("names the route, then each part as sent and gzipped", () => {
    expect(
      formatWeight({
        route: "/shop",
        document: { bytes: 999, gzip: 400 },
        styles: { bytes: 1500, gzip: 600 },
        scripts: { bytes: 31_250, gzip: 10_049 },
        elsewhere: [],
        fellBack: [],
      }),
    ).toBe(
      "/shop  document 999 B (400 B gzip)  styles 1.5 kB (600 B gzip)  scripts 31.3 kB (10.0 kB gzip)",
    );
  });
});
