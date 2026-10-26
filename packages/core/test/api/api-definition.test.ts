// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { isStreamApi } from "@asmjs/core";
import type { ApiDefinition } from "@asmjs/core";

describe("an api", () => {
  it("is one path, one method, and either a handler or a stream", () => {
    const time: ApiDefinition = { path: "/api/time", handle: () => ({ now: "..." }) };
    const ticks: ApiDefinition = { path: "/api/ticks", stream: () => undefined };
    // A definition answering several methods would need a router inside it, and the router
    // already exists one level up.
    expect(time.method).toBeUndefined();
    expect([time, ticks].map(isStreamApi)).toEqual([false, true]);
  });
});
