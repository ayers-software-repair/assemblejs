// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { MARKUP_COMMENT } from "@asmjs/build";

describe("a comment in a component's markup", () => {
  it("is each one whole, over as many lines as it takes, and nothing between two", () => {
    expect("<p>a</p><!-- b --><p>c</p><!--\nd\n--><p>e</p>".replace(MARKUP_COMMENT, "")).toBe(
      "<p>a</p><p>c</p><p>e</p>",
    );
  });
});
