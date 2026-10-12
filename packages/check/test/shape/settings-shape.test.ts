// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { SettingsShape } from "@assemblejs/check";

describe("what a project's config declares", () => {
  it("is policy, field by named field, and no file where the project has none", () => {
    const settings: SettingsShape = {
      remotes: [],
      publicRoutes: [],
      contentSecurityPolicy: null,
      authenticate: false,
      budgets: {},
      limits: {},
      outline: false,
    };
    expect(settings.file).toBeUndefined();
    expect(Object.keys(settings)).toHaveLength(7);
  });
});
