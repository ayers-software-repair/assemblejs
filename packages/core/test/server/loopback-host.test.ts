// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { loopbackHost } from "@assemblejs/core";

describe("whether a request names this machine's loopback", () => {
  it("is for localhost, 127.x and ::1, with or without a port", () => {
    for (const host of ["localhost", "LOCALHOST:3000", "127.0.0.1", "127.1.2.3:80", "[::1]:3000"]) {
      expect(loopbackHost(host), host).toBe(true);
    }
  });

  it("is not for another name, one merely starting like a loopback, or none", () => {
    for (const host of [
      "evil.example",
      "localhost.evil.example",
      "127.0.0.1.evil.example",
      "",
      undefined,
    ]) {
      expect(loopbackHost(host), String(host)).toBe(false);
    }
  });
});
