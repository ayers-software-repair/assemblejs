// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { api, start } from "@assemblejs/core/client";

// R-15, the owner's "The page's server relays the call" (2026-10-12): an assembly reaches its own
// server's apis by one address, which is the path itself on the page's own server and the relay
// under the page's server when the assembly was placed from another.
describe("the address of this server's api, from the page", () => {
  it("is the path itself for the page's own runtime", () => {
    start({ renderers: {} }).unmountAll();
    expect(api("/api/stock")).toBe("/api/stock");
    start({ renderers: {}, origin: location.origin }).unmountAll();
    expect(api("/api/stock?sku=1")).toBe("/api/stock?sku=1");
  });

  it("is the relay under the page's server for a remote's runtime", () => {
    start({ renderers: {}, origin: "https://shop.example:8443" }).unmountAll();
    expect(api("/api/stock?sku=1")).toBe(
      "/_assemblejs/remote/https%3A%2F%2Fshop.example%3A8443/api/stock?sku=1",
    );
  });

  it("takes only an api path, so nothing else of a server is reached through the relay", () => {
    start({ renderers: {}, origin: "https://shop.example" }).unmountAll();
    expect(() => api("/assembly/cart/default/")).toThrow(/api/);
    expect(() => api("api/stock")).toThrow(/api/);
  });
});
