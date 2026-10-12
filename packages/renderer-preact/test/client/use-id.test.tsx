// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { useId as usePreactId } from "preact/hooks";
import { act } from "preact/test-utils";
import { createBus } from "@assemblejs/core/client";
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-preact";
import { hydrate, useId } from "@assemblejs/renderer-preact/client";

const Field = () => {
  const id = useId();
  return (
    <label for={id}>
      q<input id={id} />
    </label>
  );
};
const made = (html: string): string => / id="([^"]+)"/.exec(html)?.[1] ?? "";

// Preact numbers the ids its own hook makes from the root of each render and takes no prefix, so
// every island on a page makes the same ones: a label in one names the input in another.
describe("an id no other element on the page has", () => {
  it("is Preact's own, which two islands share, with the placement's id before it", () => {
    const Theirs = () => <input id={usePreactId()} />;
    expect(made(renderToMarkup(Theirs, { data: {}, id: "aaaa" }))).toBe(
      made(renderToMarkup(Theirs, { data: {}, id: "bbbb" })),
    );
    const first = made(renderToMarkup(Field, { data: {}, id: "aaaa" }));
    const second = made(renderToMarkup(Field, { data: {}, id: "bbbb" }));
    expect(first).toMatch(/^aaaa-/);
    expect(second).toMatch(/^bbbb-/);
  });

  it("is Preact's own where there is no placement to name", () => {
    expect(made(renderToMarkup(Field, { data: {} }))).toMatch(/^P\d+-\d+$/);
  });

  it("is the same in the browser as the server made it", () => {
    const element = document.createElement("assembly-root");
    element.innerHTML = renderToMarkup(Field, { data: {}, id: "aaaa" });
    const sent = element.querySelector("input")?.id ?? "";
    const { events } = createBus().forAssembly({ id: "aaaa", name: "field", view: "default" });
    act(() => {
      hydrate(Field).mount(element, {}, { id: "aaaa", name: "field", view: "default", events });
    });
    expect(sent).toMatch(/^aaaa-/);
    expect(element.querySelector("input")?.id).toBe(sent);
    expect(element.querySelector("label")?.getAttribute("for")).toBe(sent);
  });
});
