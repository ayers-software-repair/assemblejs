// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { renderToString } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { Slot } from "@assemblejs/renderer-preact/client";

describe("placing a child assembly", () => {
  it("inserts its already-rendered html verbatim", () => {
    const html = renderToString(
      <Slot name="inner" children={{ inner: "<p>from another renderer</p>" }} />,
    );
    // Safe for one reason: this html came from another assembly's own renderer through the
    // composer, not from anything a visitor supplied.
    expect(html).toContain("<p>from another renderer</p>");
    expect(html).toContain(`data-assembly-slot="inner"`);
  });

  it("renders empty for a child that is not there, rather than undefined", () => {
    expect(renderToString(<Slot name="missing" children={{}} />)).not.toContain("undefined");
  });
});
