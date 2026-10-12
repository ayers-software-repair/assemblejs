// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { askedAt } from "@assemblejs/build";

describe("the address a dev server is asked at from this machine", () => {
  it("is the one it said, where that names an address", () => {
    for (const url of ["http://127.0.0.1:3000", "http://[::1]:3000", "http://192.168.1.5:8080"]) {
      expect(askedAt(url)).toBe(url);
    }
  });

  // A server told to listen on every interface says the address that means all of them, which
  // is no address to ask: the agent surface, which asks this machine alone, then saw no server.
  it("is this machine's loopback, of the same family, where it said it listens on every interface", () => {
    expect(askedAt("http://[::]:3000")).toBe("http://[::1]:3000");
    expect(askedAt("http://0.0.0.0:3000")).toBe("http://127.0.0.1:3000");
  });

  it("is what it said, where that is no url at all", () => {
    expect(askedAt("not a url")).toBe("not a url");
  });
});
