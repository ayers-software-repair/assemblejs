// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPUTED_MARKER, scriptElements } from "@assemblejs/cli";

const shown = (source: string, loader: "ts" | "tsx" = "tsx") =>
  scriptElements(source, loader).map((element) => ({
    tag: element.tag,
    attributes: [...element.attributes],
    computed: element.computed,
  }));

describe("the elements a module view writes", () => {
  it("reads each JSX element: a value written in place kept, a computed one marked, a bare one true", () => {
    const source = `export default (props: { readonly src: string }) => (
      <section className="card">
        <img src={props.src} alt="" />
        <input type="text" required />
        <Child size={3} />
      </section>
    );
    function Child(props: { readonly size: number }) { return <b>{props.size}</b>; }`;
    expect(shown(source)).toEqual([
      { tag: "section", attributes: [["classname", "card"]], computed: false },
      {
        tag: "img",
        attributes: [
          ["src", COMPUTED_MARKER],
          ["alt", ""],
        ],
        computed: true,
      },
      {
        tag: "input",
        attributes: [
          ["type", "text"],
          ["required", true],
        ],
        computed: false,
      },
      { tag: "b", attributes: [], computed: false },
    ]);
  });

  it("reads a spread of props as an element it cannot be certain of", () => {
    const source = "export default (rest: object) => <button {...rest}>go</button>;";
    expect(shown(source)).toEqual([{ tag: "button", attributes: [], computed: true }]);
  });

  it("reads a Lit template's fixed parts as markup, its expressions marked", () => {
    const source = `import { html } from "lit";
    export default (data: { readonly label: string }) =>
      html\`<button \${data.label}>go</button><img alt="A">\`;`;
    expect(shown(source, "ts")).toEqual([
      { tag: "button", attributes: [[COMPUTED_MARKER, true]], computed: true },
      { tag: "img", attributes: [["alt", "A"]], computed: false },
    ]);
  });

  it("reads only the runtime's factories: a jsx of the module's own is a call like any other", () => {
    const source = `import { jsx } from "./own-factory.js";\nexport const made = jsx("img", { alt: "" });`;
    expect(shown(source, "ts")).toEqual([]);
  });

  it("reads nothing from a module with no element, and throws for one it cannot compile", () => {
    expect(shown("export const n = 1;", "ts")).toEqual([]);
    expect(() => scriptElements("export default (", "tsx")).toThrow();
  });
});
