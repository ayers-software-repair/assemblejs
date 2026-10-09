// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PagePolicy } from "@assemblejs/cli";

describe("what a page's declaration says, as far as it is written", () => {
  it("is each placement's policy, the ones from another server, and the stream", () => {
    const policy: PagePolicy = {
      place: { cart: { deadline: 800 } },
      remote: new Map([["far", undefined]]),
      stream: undefined,
    };
    expect(Object.keys(policy).sort()).toEqual(["place", "remote", "stream"]);
  });
});
