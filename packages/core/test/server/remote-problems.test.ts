// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { remoteProblems } from "@assemblejs/core";

describe("what is checked about remotes before anything listens", () => {
  it("passes exact origins with lower-case forwarded keys, trusted or not", () => {
    expect(
      remoteProblems([
        { origin: "https://checkout.example.com", forward: ["accept-language"] },
        { origin: "http://127.0.0.1:4000", trusted: true },
      ]),
    ).toEqual([]);
  });

  it("refuses trusted written as anything but a boolean, which a truthy string would be", () => {
    const origin = "https://checkout.example.com";
    expect(remoteProblems([{ origin, trusted: "yes" as never }])).toEqual([
      `remote "${origin}" has trusted: yes; it is true or left out`,
    ]);
  });

  it("refuses events written as anything but a boolean, as it does trusted", () => {
    const origin = "https://checkout.example.com";
    expect(remoteProblems([{ origin, events: true }])).toEqual([]);
    expect(remoteProblems([{ origin, events: "yes" as never }])).toEqual([
      `remote "${origin}" has events: yes; it is true or left out`,
    ]);
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

  it("refuses forwarding a composition header, which the composer sends and a visitor must not set", () => {
    const text = remoteProblems([
      {
        origin: "https://shop.example",
        forward: ["accept-language", "assembly-params", "assembly-depth"],
      },
    ]).join();
    expect(text).toMatch(/"assembly-params", a composition header/);
    expect(text).toMatch(/"assembly-depth", a composition header/);
    expect(text).not.toMatch(/accept-language/);
  });
});
