// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { networkInterfaces } from "node:os";
import { describe, expect, it } from "vitest";
import { ownAddress } from "@assemblejs/mcp";

describe("whether a host is this machine's own", () => {
  it("is, for a loopback name, with its port or without", () => {
    for (const host of ["127.0.0.1", "127.0.0.1:3000", "localhost:3000", "[::1]:3000"]) {
      expect(ownAddress(host), host).toBe(true);
    }
  });

  it("is, for every address of every interface this machine has", () => {
    for (const one of Object.values(networkInterfaces()).flat()) {
      if (one === undefined) continue;
      const host = one.family === "IPv6" ? `[${one.address}]:3000` : `${one.address}:3000`;
      expect(ownAddress(host), host).toBe(true);
    }
  });

  it("is not, for any other host, an address or a name", () => {
    for (const host of [
      "192.0.2.1:3000",
      "example.com",
      "127.0.0.1.example.com:3000",
      "[::]:3000",
    ]) {
      expect(ownAddress(host), host).toBe(false);
    }
  });
});
