// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ServerOptions } from "@assemblejs/core";

describe("what a server is built from", () => {
  it("needs a configuration and its assemblies, and defaults the rest", () => {
    const options: ServerOptions = {
      config: { mode: "production", host: "127.0.0.1", port: 3000, auth: undefined },
      assemblies: [],
    };
    expect(options.version).toBeUndefined();
    expect(options.maxDepth).toBeUndefined();
  });
});
