// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { defineApi, streamPaths } from "@assemblejs/core";

describe("the paths a page may name as its stream", () => {
  it("are the streaming apis' paths without a parameter, and no data api's", () => {
    const paths = streamPaths([
      defineApi({ path: "/api/ticks", stream: () => undefined }),
      defineApi({ path: "/api/rooms/:id", stream: () => undefined }),
      defineApi({ path: "/api/time", handle: () => null }),
    ]);
    expect([...paths]).toEqual(["/api/ticks"]);
  });
});
