// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { remoteProblems } from "@assemblejs/core";

describe("what is checked about remotes before anything listens", () => {
  it("passes exact origins with lower-case forwarded keys", () => {
    expect(
      remoteProblems([
        { origin: "https://checkout.example.com", forward: ["accept-language"] },
        { origin: "http://127.0.0.1:4000" },
      ]),
    ).toEqual([]);
  });

  it("refuses anything that is not exactly an origin, so the allowlist compares like with like", () => {
    for (const origin of [
      "https://checkout.example.com/",
      "https://checkout.example.com/assembly",
      "checkout.example.com",
      "ftp://checkout.example.com",
      "https://user@checkout.example.com",
      "HTTPS://CHECKOUT.EXAMPLE.COM",
    ]) {
      expect(remoteProblems([{ origin }]).join()).toMatch(/is not an origin/);
    }
  });

  it("refuses an origin declared twice, and a forwarded key that is not a header name", () => {
    const origin = "https://checkout.example.com";
    expect(remoteProblems([{ origin }, { origin }]).join()).toMatch(/more than once/);
    expect(remoteProblems([{ origin, forward: ["Accept-Language"] }]).join()).toMatch(/lower-case/);
  });
});
