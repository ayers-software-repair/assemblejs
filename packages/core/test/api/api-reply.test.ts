// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ApiReply } from "@asmjs/core";

describe("what an api answers when a plain value is not enough", () => {
  it("is a status, headers and cookies, and a body only when there is one", () => {
    const made: ApiReply = { status: 204, headers: {}, cookies: {} };
    expect(Object.keys(made).sort()).toEqual(["cookies", "headers", "status"]);
  });
});
