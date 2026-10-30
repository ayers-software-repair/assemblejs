// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { scriptElements } from "@asmjs/check";

const shown = async (source: string, loader: "ts" | "tsx" = "tsx") =>
  (await scriptElements(source, loader)).map((element) => ({
    tag: element.tag,
    attributes: [...element.attributes],
    computed: element.computed,
  }));

describe("the elements a module view writes", () => {
  it("reads each JSX element: a value written in place kept, a computed one marked, a bare one true", async () => {
    const source = `export default (props: { readonly src: string }) => (
      <section className="card">
        <img src={props.src} alt="" />
        <input type="text" required />
        <Child size={3} />
      </section>
    );
    function Child(props: { readonly size: number }) { return <b>{props.size}</b>; }`;
    expect(await shown(source)).toEqual([
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

  it("reads a spread of props as an element it cannot be certain of", async () => {
    const source = "export default (rest: object) => <button {...rest}>go</button>;";
    expect(await shown(source)).toEqual([
      { tag: "button", attributes: [[COMPUTED_MARKER, true]], computed: true },
    ]);
    // Beside an attribute that is computed too, it is still said.
    const both =
      "export default (p: { rest: object; src: string }) => <img {...p.rest} src={p.src} />;";
    expect(await shown(both)).toEqual([
      {
        tag: "img",
        attributes: [
          [COMPUTED_MARKER, true],
          ["src", COMPUTED_MARKER],
        ],
        computed: true,
      },
    ]);
  });

  it("reads a Lit template's fixed parts as markup, its expressions marked", async () => {
    const source = `import { html } from "lit";
    export default (data: { readonly label: string }) =>
      html\`<button \${data.label}>go</button><img alt="A">\`;`;
    expect(await shown(source, "ts")).toEqual([
      { tag: "button", attributes: [[COMPUTED_MARKER, true]], computed: true },
      { tag: "img", attributes: [["alt", "A"]], computed: false },
    ]);
  });

  it("reads only the runtime's factories: a jsx of the module's own is a call like any other", async () => {
    const source = `import { jsx } from "./own-factory.js";\nexport const made = jsx("img", { alt: "" });`;
    expect(await shown(source, "ts")).toEqual([]);
  });

  it("reads nothing from a module with no element, and throws for one it cannot compile", async () => {
    expect(await shown("export const n = 1;", "ts")).toEqual([]);
    await expect(scriptElements("export default (", "tsx")).rejects.toThrow();
  });
});
