// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { relayedUrl } from "@assemblejs/core";

const ORIGIN = "https://shop.example:8443";
const ask = (rest: string) =>
  relayedUrl(ORIGIN, `/_assemblejs/remote/${encodeURIComponent(ORIGIN)}${rest}`)?.href;

describe("the address a relay request asks for on a remote", () => {
  it("is the api path and query on the declared origin", () => {
    expect(ask("/api/stock?sku=1")).toBe(`${ORIGIN}/api/stock?sku=1`);
    expect(ask("/api")).toBe(`${ORIGIN}/api`);
  });

  it("is nothing that is not an api, however it is spelled", () => {
    for (const rest of [
      "/assembly/cart/default/",
      "/",
      "/api/../assembly/cart/",
      "/api/%2e%2e/assembly/cart/",
      "/api\\..\\assembly\\cart\\",
      "//elsewhere.example/api/x",
      "/_assemblejs/health",
    ]) {
      expect(ask(rest), rest).toBeUndefined();
    }
  });
});
