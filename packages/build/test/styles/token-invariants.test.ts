// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { TOKEN_INVARIANTS } from "@assemblejs/build";

describe("what must be true of the colour roles", () => {
  it("holds each ink to 4.5:1 on each ground, and each accent to 3:1 on the surfaces", () => {
    const text = TOKEN_INVARIANTS.filter((one) => one.least === 4.5);
    const controls = TOKEN_INVARIANTS.filter((one) => one.least === 3);
    expect(text.map((one) => `${one.role} on ${one.ground}`)).toEqual([
      "--ink on --surface",
      "--ink on --surface-panel",
      "--ink on --accent-wash",
      "--ink-muted on --surface",
      "--ink-muted on --surface-panel",
      "--ink-muted on --accent-wash",
    ]);
    expect(controls).toHaveLength(6);
    expect(TOKEN_INVARIANTS).toHaveLength(12);
    for (const one of TOKEN_INVARIANTS) expect(one.because).toMatch(/WCAG 2\.2, 1\.4\.(3|11)/);
  });
});
