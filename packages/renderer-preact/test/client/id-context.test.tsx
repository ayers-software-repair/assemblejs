// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContext } from "preact/hooks";
import { renderToString } from "preact-render-to-string";
import { describe, expect, it } from "vitest";
import { IdContext } from "@assemblejs/renderer-preact/client";

const Shown = () => <p>{useContext(IdContext)}</p>;

describe("the id of the placement an assembly was mounted for", () => {
  it("is nothing outside an assembly", () => {
    expect(renderToString(<Shown />)).toBe("<p></p>");
  });

  it("is what the renderer provides, to every component inside it", () => {
    expect(
      renderToString(
        <IdContext.Provider value="a7f3">
          <section>
            <Shown />
          </section>
        </IdContext.Provider>,
      ),
    ).toBe("<section><p>a7f3</p></section>");
  });
});
