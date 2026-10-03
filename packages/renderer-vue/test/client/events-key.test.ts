// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { EVENTS_KEY } from "@assemblejs/renderer-vue/client";

describe("the key the events are provided under", () => {
  it("is a symbol, so nothing provided by another library can collide with it", () => {
    expect(typeof EVENTS_KEY).toBe("symbol");
  });
});
