// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { PageDefinition } from "@assemblejs/core";

describe("a page", () => {
  it("is a route and a whole document, with policy only where a placement needs it", () => {
    const home: PageDefinition = {
      route: "/",
      template: '<!doctype html><html><body><assembly name="hello"></assembly></body></html>',
    };
    expect(home.place).toBeUndefined();
  });
});
