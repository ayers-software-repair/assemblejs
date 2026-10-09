// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { shadowCss } from "@assemblejs/cli";

describe("an assembly's stylesheet for its own shadow root", () => {
  it("leaves selectors as written, because the shadow boundary is the scope", () => {
    expect(shadowCss(".title, p > a { color: red }", "x.css")).toBe(".title, p > a { color: red }");
  });

  it("names the envelope as the shadow root sees it", () => {
    expect(shadowCss(":scope { display: block } :scope .a { margin: 0 }", "x.css")).toBe(
      ":host { display: block } :host .a { margin: 0 }",
    );
  });
});
