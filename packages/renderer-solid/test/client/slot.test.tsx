// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { render } from "solid-js/web";
import { describe, expect, it } from "vitest";
import { Slot } from "@assemblejs/renderer-solid/client";

describe("placing a child assembly", () => {
  it("writes the directive the composer replaces, inside the slot's element", () => {
    const element = document.createElement("div");
    const dispose = render(() => <Slot name="inner" />, element);
    expect(element.innerHTML).toBe(
      '<div data-assembly-slot="inner"><assembly name="inner"></assembly></div>',
    );
    dispose();
    const other = document.createElement("div");
    const disposeOther = render(() => <Slot name="price" view="compact" />, other);
    expect(other.innerHTML).toContain('<assembly name="price" view="compact"></assembly>');
    disposeOther();
  });

  // The one place a Solid assembly writes markup it did not escape writes only the directive.
  it("refuses a name that is not a segment, rather than write it as markup", () => {
    const element = document.createElement("div");
    expect(() => render(() => <Slot name={'x"><script>alert(1)</script>'} />, element)).toThrow(
      /not a usable url segment/,
    );
  });
});
