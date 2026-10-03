// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isPrivateAddress } from "@assemblejs/core";

describe("an address inside the server's own network", () => {
  it("is loopback, link-local, private, shared or unspecified", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "::",
      "fd00::1",
      "fe80::1",
      "::ffff:10.0.0.1",
      "::ffff:7f00:1",
      "0:0:0:0:0:ffff:7f00:1",
      "0000:0000:0000:0000:0000:ffff:127.0.0.1",
      "0:0:0:0:0:0:0:1",
      "FE80::1",
      "fec0::1",
      "64:ff9b::a00:1",
      "198.18.0.1",
      "192.0.0.1",
      "224.0.0.1",
      "240.0.0.1",
      "255.255.255.255",
    ]) {
      expect(isPrivateAddress(address), address).toBe(true);
    }
  });

  it("is not a public address, nor anything that is not an address", () => {
    for (const address of [
      "93.184.216.34",
      "::ffff:5db8:d822",
      "100.128.0.1",
      "172.32.0.1",
      "192.169.0.1",
      "2606:4700::1111",
      "example.com",
    ]) {
      expect(isPrivateAddress(address), address).toBe(false);
    }
  });
});
