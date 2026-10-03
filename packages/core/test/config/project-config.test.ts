// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { ProjectConfig } from "@assemblejs/core";

describe("what assemblejs.config.ts declares", () => {
  it("is policy only, and none of it is required", () => {
    const none: ProjectConfig = {};
    const remotes: ProjectConfig = { remotes: [{ origin: "https://checkout.example.com" }] };
    expect(none.remotes).toBeUndefined();
    expect(remotes.remotes).toHaveLength(1);
  });
});
