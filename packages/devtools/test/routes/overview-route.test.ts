// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { overviewRoute } from "@assemblejs/devtools";
import { view } from "../fixtures/view.js";

describe("the overview route", () => {
  it("answers the overview as html, at the prefix itself, for a read", async () => {
    expect([overviewRoute.method, overviewRoute.path]).toEqual(["GET", "/"]);
    const answer = await overviewRoute.respond(view());
    expect(answer.type).toBe("text/html; charset=utf-8");
    expect(answer.body).toContain("AssembleJS devtools");
  });
});
