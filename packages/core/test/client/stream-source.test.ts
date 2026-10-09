// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { StreamSource } from "@assemblejs/core/client";

describe("what the runtime uses of an event source", () => {
  it("is its message handler and its close, which a test can stand in for", () => {
    let closed = false;
    const source: StreamSource = { onmessage: null, close: () => (closed = true) };
    source.close();
    expect(closed).toBe(true);
  });
});
