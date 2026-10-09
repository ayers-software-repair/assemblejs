// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { DevtoolsAnswer } from "@assemblejs/core";

describe("what a devtools route answers", () => {
  it("is a body and the media type it is read as", () => {
    const answer: DevtoolsAnswer = { type: "text/plain; charset=utf-8", body: "ok" };
    expect(Object.keys(answer).sort()).toEqual(["body", "type"]);
  });
});
