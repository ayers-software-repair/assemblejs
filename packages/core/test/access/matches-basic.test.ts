// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { matchesBasic } from "@assemblejs/core";

const basic = (pair: string) => `Basic ${Buffer.from(pair).toString("base64")}`;
const credentials = { user: "ada", password: "s3cret:with:colons" };

describe("basic credentials", () => {
  it("match exactly the configured user and password", () => {
    expect(matchesBasic(basic("ada:s3cret:with:colons"), credentials)).toBe(true);
    // The scheme is case insensitive, as HTTP says.
    expect(
      matchesBasic(basic("ada:s3cret:with:colons").replace(/^Basic/, "basic"), credentials),
    ).toBe(true);
  });

  it("refuse anything else", () => {
    for (const header of [
      undefined,
      "",
      "Bearer x",
      basic("ada:wrong"),
      basic("bob:s3cret:with:colons"),
      basic("ada"),
      basic("ada:s3cret:with:colonsX"),
    ]) {
      expect(matchesBasic(header, credentials)).toBe(false);
    }
  });
});
