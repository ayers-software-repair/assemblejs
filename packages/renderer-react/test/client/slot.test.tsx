// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { findPlacements } from "@assemblejs/core";
import { Slot } from "@assemblejs/renderer-react/client";

describe("placing a child assembly", () => {
  it("writes the directive the composer replaces, inside the slot's element", () => {
    expect(renderToString(<Slot name="inner" />)).toBe(
      '<div data-assembly-slot="inner"><assembly name="inner"></assembly></div>',
    );
    expect(renderToString(<Slot name="price" view="compact" />)).toContain(
      '<assembly name="price" view="compact"></assembly>',
    );
  });

  it("writes what the composer reads as exactly that placement", () => {
    expect(findPlacements(renderToString(<Slot name="price" view="compact" />))).toMatchObject([
      { name: "price", view: "compact" },
    ]);
  });

  // A slot keeps one object in its own state, so a parent rendering again writes nothing. The
  // state follows the directive: a slot given another name writes that name's directive.
  it("writes another directive when it is given another name", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    let rename = (name: string): void => void name;
    const Parent = () => {
      const [name, setName] = useState("first");
      rename = setName;
      return <Slot name={name} />;
    };
    const element = document.createElement("div");
    const root = createRoot(element);
    await act(async () => root.render(<Parent />));
    expect(element.innerHTML).toContain('<assembly name="first"></assembly>');
    await act(async () => rename("second"));
    expect(element.innerHTML).toBe(
      '<div data-assembly-slot="second"><assembly name="second"></assembly></div>',
    );
    await act(async () => root.unmount());
  });

  // The one place a React assembly writes markup it did not escape writes only the directive.
  it("refuses a name that is not a segment, rather than write it as markup", () => {
    expect(() => renderToString(<Slot name={'x"><script>alert(1)</script>'} />)).toThrow(
      /not a usable url segment/,
    );
  });
});
