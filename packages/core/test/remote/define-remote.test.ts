// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineRemote } from "@assemblejs/core";

describe("declaring a remote", () => {
  it("returns the declaration unchanged", () => {
    const remote = { origin: "https://checkout.example.com", forward: ["accept-language"] };
    expect(defineRemote(remote)).toBe(remote);
  });
});
