// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { carriesCredential } from "@assemblejs/core";

describe("detecting a credentialled request", () => {
  it("finds the credential headers whatever their case", () => {
    expect(carriesCredential({ Authorization: "Bearer x" })).toBe(true);
    expect(carriesCredential({ cookie: "s=1" })).toBe(true);
    expect(carriesCredential({ "Proxy-Authorization": "Basic x" })).toBe(true);
  });

  it("says no for an ordinary request, which is the one that may be cached", () => {
    expect(carriesCredential({ "accept-language": "en" })).toBe(false);
    expect(carriesCredential({})).toBe(false);
  });
});
