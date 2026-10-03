// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { insideForm } from "@assemblejs/core";

const at = (template: string): boolean => insideForm(template, template.indexOf("<assembly"));

describe("whether a place in a page template is inside one of its forms", () => {
  it("is, inside an open form, nested or not, whatever its case", () => {
    expect(at('<form action="/x"><p><assembly name="a"/></p></form>')).toBe(true);
    expect(at('<FORM><form></form><assembly name="a"/></FORM>')).toBe(true);
  });

  it("is not, after a form closed, in a comment, or in a name that only starts the same", () => {
    expect(at('<form></form><assembly name="a"/>')).toBe(false);
    expect(at('<!-- <form> --><assembly name="a"/>')).toBe(false);
    expect(at('<formula><assembly name="a"/></formula>')).toBe(false);
  });
});
