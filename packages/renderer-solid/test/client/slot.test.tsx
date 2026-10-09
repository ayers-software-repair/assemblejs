// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { render } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { Slot } from "@assemblejs/renderer-solid/client";

describe("placing a child assembly", () => {
  it("inserts its already-rendered html verbatim", () => {
    const element = document.createElement("div");
    const dispose = render(
      () => <Slot name="inner" children={{ inner: "<p>from another renderer</p>" }} />,
      element,
    );
    // Safe for one reason: this html came from another assembly's own renderer through the
    // composer, not from anything a visitor supplied.
    expect(element.innerHTML).toContain("<p>from another renderer</p>");
    expect(element.innerHTML).toContain(`data-assembly-slot="inner"`);
    dispose();
  });

  it("renders empty for a child that is not there, rather than undefined", () => {
    const element = document.createElement("div");
    const dispose = render(() => <Slot name="missing" children={{}} />, element);
    expect(element.innerHTML).not.toContain("undefined");
    dispose();
  });
});
