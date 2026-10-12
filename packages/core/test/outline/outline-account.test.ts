// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { OutlineAccount } from "@assemblejs/core/outline";

describe("how a page was composed, as its outline is told", () => {
  it("is the page's route, how long composing it took and what it placed", () => {
    const account: OutlineAccount = { route: "/products/:id", ms: 48, placements: [] };
    expect(JSON.parse(JSON.stringify(account))).toEqual(account);
  });
});
