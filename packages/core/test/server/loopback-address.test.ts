// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { loopbackAddress } from "@assemblejs/core";

describe("whether a connection came from this machine", () => {
  it("is for a loopback peer, IPv4, IPv6 or IPv4 mapped into IPv6", () => {
    for (const address of ["127.0.0.1", "127.9.8.7", "::1", "::ffff:127.0.0.1"]) {
      expect(loopbackAddress(address), address).toBe(true);
    }
  });

  it("is not for any other peer, or none", () => {
    for (const address of [
      "203.0.113.5",
      "10.0.0.1",
      "::ffff:10.0.0.1",
      "fe80::1",
      "",
      undefined,
    ]) {
      expect(loopbackAddress(address), String(address)).toBe(false);
    }
  });
});
