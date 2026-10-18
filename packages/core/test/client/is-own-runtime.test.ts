// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { isOwnRuntime } from "@assemblejs/core/client";

describe("whether a runtime is the page's own", () => {
  it("is so for no origin and for the page's origin, and not for another server's", () => {
    expect(isOwnRuntime(undefined)).toBe(true);
    expect(isOwnRuntime(location.origin)).toBe(true);
    expect(isOwnRuntime("https://remote.example")).toBe(false);
  });
});
