// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { MarkupInput } from "@assemblejs/core";

describe("what producing markup is given", () => {
  it("is the view's data and its placement's id, and never a child", () => {
    const input: MarkupInput = { data: { total: 2 }, id: "a7f3" };
    // A view places a child by writing the directive; the composer puts the child there once
    // the view has rendered, so nothing of a child is ever handed to it.
    expect(Object.keys(input).sort()).toEqual(["data", "id"]);
  });
});
