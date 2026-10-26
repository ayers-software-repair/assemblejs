// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { CookieOptions } from "@asmjs/core";

describe("a cookie an api sets", () => {
  it("needs only a value; every attribute is optional", () => {
    const cookie: CookieOptions = { value: "s1" };
    expect(Object.keys(cookie)).toEqual(["value"]);
  });
});
