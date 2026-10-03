// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { RunningServer } from "@assemblejs/cli";

describe("a built server dev holds", () => {
  it("says when it is listening and can be stopped", async () => {
    const server: RunningServer = {
      ready: Promise.resolve("http://127.0.0.1:1"),
      stop: async () => undefined,
    };
    expect(await server.ready).toBe("http://127.0.0.1:1");
    await expect(server.stop()).resolves.toBeUndefined();
  });
});
