// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { projectRoute } from "@assemblejs/devtools";
import { view } from "../fixtures/view.js";

describe("the project route", () => {
  it("answers the same reading as JSON, for a read", async () => {
    expect([projectRoute.method, projectRoute.path]).toEqual(["GET", "/project.json"]);
    const failure = { correlationId: "8f212c16", message: "m", stack: undefined };
    const answer = await projectRoute.respond(view([failure]));
    expect(answer.type).toBe("application/json; charset=utf-8");
    expect(JSON.parse(answer.body)).toEqual({
      project: view().project,
      failures: [{ correlationId: "8f212c16", message: "m" }],
    });
  });
});
