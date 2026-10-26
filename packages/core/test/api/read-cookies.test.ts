// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readCookies } from "@asmjs/core";

describe("reading a request's cookies", () => {
  it("splits pairs on semicolons, trims, and decodes the value", () => {
    expect({ ...readCookies("a=1;  session=abc%20d ; b=x=y") }).toEqual({
      a: "1",
      session: "abc d",
      b: "x=y",
    });
  });

  it("keeps a value that does not decode as written", () => {
    expect(readCookies("a=%E0%A4%A")["a"]).toBe("%E0%A4%A");
  });

  it("keeps the first of a name sent twice, and drops a pair with no name or no equals sign", () => {
    expect({ ...readCookies("a=1; a=2; =3; stray; b=") }).toEqual({ a: "1", b: "" });
  });

  it("is empty for no header, and a name like constructor is only a cookie", () => {
    expect({ ...readCookies(undefined) }).toEqual({});
    expect(readCookies("constructor=1")["constructor"]).toBe("1");
    expect(readCookies("a=1")["constructor"]).toBeUndefined();
  });
});
