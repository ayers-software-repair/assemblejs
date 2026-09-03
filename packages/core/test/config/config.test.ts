// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { Config } from "@assemblejs/core";

describe("the resolved configuration", () => {
  it("says the control is off by its absence, not by a flag that could be misread", () => {
    const config: Config = { mode: "production", host: "127.0.0.1", port: 3000, auth: undefined };
    expect(config.auth).toBeUndefined();
  });
});
