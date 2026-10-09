// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineApi, isStreamApi } from "@assemblejs/core";

describe("telling a stream from a data api", () => {
  it("is whether it has a stream in place of a handler", () => {
    expect(isStreamApi(defineApi({ path: "/a", handle: () => null }))).toBe(false);
    expect(isStreamApi(defineApi({ path: "/b", stream: () => undefined }))).toBe(true);
  });
});
