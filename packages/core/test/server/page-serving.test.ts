// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { DEFAULT_LIMITS, createMemoryCache, createRemoteTransport, localFetch } from "@asmjs/core";
import type { PageServing } from "@asmjs/core";

describe("what every page of a server is answered with", () => {
  it("needs only the transports, the bounds, the cache and the log", () => {
    const silent = (): undefined => undefined;
    const serving: PageServing = {
      assemblies: new Map(),
      local: localFetch(new Map(), silent, DEFAULT_LIMITS),
      limits: DEFAULT_LIMITS,
      remote: createRemoteTransport({
        remotes: [],
        maxBytes: DEFAULT_LIMITS.maxBytes,
        log: silent,
      }),
      remotes: [],
      cache: createMemoryCache(),
      log: silent,
    };
    expect(serving.outline).toBeUndefined();
    expect(serving.admit).toBeUndefined();
  });
});
