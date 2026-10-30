// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { scriptPlacements } from "@asmjs/build";

const react = (body: string, imported = "Slot"): string =>
  `import { ${imported} } from "@asmjs/renderer-react/client";\nexport default function Shell(props: { view: string; name: string }) { return <section>${body}</section>; }`;

describe("the slots a view written as a module places", () => {
  it("are every Slot it writes, with the name and the view written in place", async () => {
    expect(
      await scriptPlacements(
        react('<Slot name="cart" /><Slot name="price" view="compact" /><Slot name="cart" />'),
        "tsx",
      ),
    ).toEqual({
      placements: [
        { name: "cart", view: "default" },
        { name: "price", view: "compact" },
      ],
      unnamed: [],
    });
  });

  it("leave a computed view out, and report a computed or a spread name", async () => {
    const read = await scriptPlacements(
      react('<Slot name="price" view={props.view} /><Slot name={props.name} /><Slot {...props} />'),
      "tsx",
    );
    expect(read.placements).toEqual([{ name: "price" }]);
    expect(read.unnamed).toHaveLength(2);
  });

  it("follow the name the module imports the slot under, and no other component called Slot", async () => {
    expect(
      (await scriptPlacements(react('<Place name="cart" />', "Slot as Place"), "tsx")).placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    const own = `import { Slot } from "./slot.js";\nexport default () => <Slot name="cart" />;`;
    expect((await scriptPlacements(own, "tsx")).placements).toEqual([]);
  });

  it("are read under a namespace the module imports the whole of a renderer's client as", async () => {
    const react = `import * as client from "@asmjs/renderer-react/client";\nexport default (props: { name: string }) => <><client.Slot name="cart" view="wide" /><client.Slot name={props.name} /><client.Other name="price" /></>;`;
    const read = await scriptPlacements(react, "tsx");
    expect(read.placements).toEqual([{ name: "cart", view: "wide" }]);
    expect(read.unnamed).toEqual(["<client.Slot> with a name the view computes"]);
    const lit = `import * as client from "@asmjs/renderer-lit/client";\nimport { html } from "lit";\nexport default () => html\`<section>\${client.slot("price")}\${client["slot"]("cart")}</section>\`;`;
    expect((await scriptPlacements(lit, "ts")).placements).toEqual([
      { name: "price", view: "default" },
      { name: "cart", view: "default" },
    ]);
    // A namespace of anything else is not a renderer's, whatever it holds.
    const other = `import * as ui from "./ui.js";\nexport default () => <ui.Slot name="cart" />;`;
    expect((await scriptPlacements(other, "tsx")).placements).toEqual([]);
  });

  it("are every call of a renderer's slot() in a Lit view", async () => {
    const lit = `import { slot } from "@asmjs/renderer-lit/client";\nimport { html } from "lit";\nexport default (props: { which: string }) => html\`<section>\${slot("cart")}\${slot("price", "compact")}\${slot("badge", props.which)}\${slot(props.which)}</section>\`;`;
    const read = await scriptPlacements(lit, "ts");
    expect(read.placements).toEqual([
      { name: "cart", view: "default" },
      { name: "price", view: "compact" },
      { name: "badge" },
    ]);
    expect(read.unnamed).toEqual(["slot(...) with a name the view computes"]);
  });

  it("reports a slot written inside an element's render as placed in its shadow root, not by the view", async () => {
    const lit = `import { slot } from "@asmjs/renderer-lit/client";\nimport { LitElement, html } from "lit";\nexport class ShopCard extends LitElement { render() { return html\`<p>\${slot("price")}</p>\`; } helper() { return slot("badge"); } }\nexport default () => html\`<shop-card></shop-card>\${slot("cart")}\`;`;
    const read = await scriptPlacements(lit, "ts");
    expect(read.placements).toEqual([
      { name: "badge", view: "default" },
      { name: "cart", view: "default" },
    ]);
    expect(read.shadowed).toEqual(['ShopCard.render() places "price"']);
  });

  // A class with a render is a Lit element where its slot is Lit's. A React or a Preact class
  // component has no shadow root, and its Slot is a placement of the view's like any other.
  it("reads a Slot in a class component's render as a placement of the view's", async () => {
    for (const renderer of ["react", "preact"]) {
      const view = `import { Component } from "${renderer}";\nimport { Slot } from "@asmjs/renderer-${renderer}/client";\nexport default class Shell extends Component { render() { return <section><Slot name="cart" /></section>; } }`;
      const read = await scriptPlacements(view, "tsx");
      expect(read.placements, renderer).toEqual([{ name: "cart", view: "default" }]);
      expect(read.shadowed, renderer).toBeUndefined();
    }
  });

  it("throws for a module that cannot be compiled", async () => {
    await expect(scriptPlacements("export default <", "tsx")).rejects.toThrow();
  });
});
