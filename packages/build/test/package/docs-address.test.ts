// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { docsAddress } from "@asmjs/build";

describe("the address of the documentation for a version's channel", () => {
  it("is beneath next for a prerelease, whatever its tag", () => {
    expect(docsAddress("1.0.0-next.0")).toBe("https://assemblejs.com/next/");
    expect(docsAddress("2.3.4-rc.1")).toBe("https://assemblejs.com/next/");
    expect(docsAddress("1.0.0-0+build.5")).toBe("https://assemblejs.com/next/");
  });

  it("is the product's own for a stable, build metadata or not", () => {
    expect(docsAddress("1.0.0")).toBe("https://assemblejs.com/");
    expect(docsAddress("1.2.3+sha-5114f85")).toBe("https://assemblejs.com/");
  });
});
