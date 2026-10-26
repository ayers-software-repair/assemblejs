// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AdmitVisitor } from "@asmjs/core";

describe("how a route asks whether one request's visitor may be shown a placement", () => {
  it("is made from what the visitor sent, or is nothing where everyone is let in", () => {
    const guests: AdmitVisitor = (sent) =>
      sent["x-guest"] === undefined ? undefined : (name) => ({ admitted: name !== "ledger" });
    expect(guests({})).toBeUndefined();
    expect(guests({ "x-guest": "yes" })?.("ledger", "default")).toEqual({ admitted: false });
  });
});
