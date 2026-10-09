// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { OVERVIEW_STYLESHEET, stylesheetRoute } from "@assemblejs/devtools";
import { view } from "../fixtures/view.js";

describe("the stylesheet route", () => {
  it("answers the overview's stylesheet as CSS, for a read", async () => {
    expect([stylesheetRoute.method, stylesheetRoute.path]).toEqual(["GET", "/devtools.css"]);
    expect(await stylesheetRoute.respond(view())).toEqual({
      type: "text/css; charset=utf-8",
      body: OVERVIEW_STYLESHEET,
    });
  });
});
