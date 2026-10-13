// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { RENDERERS, jsxOwner } from "@assemblejs/build";

describe("the owner of a renderer's JSX", () => {
  it("is the framework itself, for the three whose views are JSX", () => {
    expect(jsxOwner("react")).toBe("react");
    expect(jsxOwner("preact")).toBe("preact");
    expect(jsxOwner("solid")).toBe("solid");
  });

  it("is none for every other renderer the build knows, and for one it does not", () => {
    for (const renderer of RENDERERS.filter((one) => !["react", "preact", "solid"].includes(one))) {
      expect(jsxOwner(renderer), renderer).toBeUndefined();
    }
    expect(jsxOwner("angular")).toBeUndefined();
  });
});
