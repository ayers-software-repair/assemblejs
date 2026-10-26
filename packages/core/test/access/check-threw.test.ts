// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { checkThrew } from "@asmjs/core";

describe("the line logged when the product's own check throws", () => {
  it("carries what it threw against the id whoever was refused is told", () => {
    const error = new Error("the check broke");
    expect(checkThrew("c-9", error)).toEqual({
      correlationId: "c-9",
      message: "the authenticate check threw: the check broke",
      stack: error.stack,
    });
  });

  it("says what was thrown when it was not an error, with no stack", () => {
    expect(checkThrew("c-9", "nope")).toEqual({
      correlationId: "c-9",
      message: "the authenticate check threw: nope",
      stack: undefined,
    });
  });
});
