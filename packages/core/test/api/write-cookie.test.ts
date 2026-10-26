// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readCookies, writeCookie } from "@asmjs/core";

describe("writing a cookie", () => {
  it("is name=value and nothing else when nothing else is given", () => {
    expect(writeCookie("session", { value: "s1" })).toBe("session=s1");
  });

  it("puts the attributes in the order of RFC 6265, each only when given", () => {
    expect(
      writeCookie("session", {
        value: "s1",
        sameSite: "none",
        httpOnly: true,
        secure: true,
        expires: new Date(Date.UTC(2026, 9, 18, 12, 0, 0)),
        maxAge: 60.9,
        domain: "example.com",
        path: "/",
      }),
    ).toBe(
      "session=s1; Path=/; Domain=example.com; Max-Age=60; Expires=Sun, 18 Oct 2026 12:00:00 GMT; Secure; HttpOnly; SameSite=None",
    );
    expect(writeCookie("a", { value: "1", secure: false, httpOnly: false })).toBe("a=1");
  });

  it("percent-encodes the value so readCookies gives it back", () => {
    const written = writeCookie("who", { value: "a b;c=d" });
    expect(written).toBe("who=a%20b%3Bc%3Dd");
    expect(readCookies(written)["who"]).toBe("a b;c=d");
  });

  it("refuses a path or domain that would add an attribute of its own", () => {
    expect(() => writeCookie("a", { value: "1", path: "/; Secure" })).toThrow(/Path/);
    expect(() => writeCookie("a", { value: "1", domain: "x\r\ny" })).toThrow(/Domain/);
  });
});
