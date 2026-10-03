// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { devtools, overviewRoute, projectRoute, stylesheetRoute } from "@assemblejs/devtools";

describe("the devtools a server is handed", () => {
  it("are the overview, its stylesheet and the JSON reading, every one a read", () => {
    const { routes } = devtools();
    expect(routes).toEqual([overviewRoute, stylesheetRoute, projectRoute]);
    expect(routes.every((route) => route.method === "GET")).toBe(true);
  });
});
