// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isReply, reply } from "@assemblejs/core";

describe("telling a reply from a JSON answer", () => {
  it("takes what reply made", () => {
    expect(isReply(reply({ status: 204 }))).toBe(true);
    expect(isReply(reply.redirect("/next"))).toBe(true);
  });

  it("never takes a plain object with the same members", () => {
    expect(isReply({ status: 204, headers: {}, cookies: {} })).toBe(false);
  });

  it("does not take a reply that went through JSON, which loses the mark", () => {
    expect(isReply(JSON.parse(JSON.stringify(reply({ status: 204 }))))).toBe(false);
  });
});
