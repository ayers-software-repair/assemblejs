// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { RemoteTransport } from "@assemblejs/core";

describe("the way to reach other servers", () => {
  it("is a fetch per url and the files each remote assembly declared", async () => {
    const transport: RemoteTransport = {
      fetch: async () => ({ ok: true, html: "", source: "remote" }),
      assets: () => undefined,
    };
    expect(transport.assets("https://a.example.com/assembly/cart/")).toBeUndefined();
    expect((await transport.fetch("u", {} as never)).ok).toBe(true);
  });
});
