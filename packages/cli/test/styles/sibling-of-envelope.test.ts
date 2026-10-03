// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { siblingOfEnvelope } from "@assemblejs/cli";

describe("selectors that reach a sibling of the assembly's envelope", () => {
  it("are those that name the envelope and then a sibling of it", () => {
    for (const selector of [
      ":scope ~ .y",
      ":root + .y",
      "html ~ .y",
      "body + .y",
      ":host ~ .y",
      ":host(.on) ~ .z",
      "html.dark ~ .y",
      ".a :scope + .b",
    ]) {
      expect(siblingOfEnvelope(selector), selector).toEqual([selector]);
    }
  });

  it("are not those that stay inside it, a sibling inside included", () => {
    for (const selector of [
      ".a ~ .b",
      ":scope > .a + .b",
      "body .a ~ .b",
      ":not(:scope) ~ .a",
      ".x body ~ .y",
    ]) {
      expect(siblingOfEnvelope(selector), selector).toEqual([]);
    }
    expect(siblingOfEnvelope(".a, :scope ~ .b")).toEqual([":scope ~ .b"]);
  });
});
