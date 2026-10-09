// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DiscoveredPage } from "@assemblejs/cli";

describe("a page found on disk", () => {
  it("is its route, its template, and the file declaring it when there is one", () => {
    const page: DiscoveredPage = {
      name: "home",
      route: "/",
      template: "src/pages/home/home.html",
      declaration: undefined,
    };
    expect(page.route).toBe("/");
  });
});
