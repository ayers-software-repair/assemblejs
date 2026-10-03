// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { pageFetch } from "@assemblejs/core";
import type { AssemblyRequest } from "@assemblejs/core";

const request = (name: string) => ({ name }) as AssemblyRequest;

describe("the one transport a page's composer is given", () => {
  it("sends a placement whose plan names a url to the remote transport, and every other one local", async () => {
    const seen: string[] = [];
    const fetch = pageFetch(
      {
        cart: {
          name: "cart",
          view: "default",
          deadline: 100,
          url: "https://a.example.com/assembly/cart/",
        },
      },
      async (req) => {
        seen.push(`local ${req.name}`);
        return { ok: true, html: "", source: "local" };
      },
      {
        fetch: async (url, req) => {
          seen.push(`remote ${req.name} ${url}`);
          return { ok: true, html: "", source: "remote" };
        },
        assets: () => undefined,
      },
    );
    await fetch(request("cart"));
    await fetch(request("hello"));
    await fetch(request("constructor"));
    expect(seen).toEqual([
      "remote cart https://a.example.com/assembly/cart/",
      "local hello",
      "local constructor",
    ]);
  });
});
