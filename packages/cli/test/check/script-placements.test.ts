// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { scriptPlacements } from "@assemblejs/cli";

const react = (body: string, imported = "Slot"): string =>
  `import { ${imported} } from "@assemblejs/renderer-react/client";\nexport default function Shell(props: { view: string; name: string }) { return <section>${body}</section>; }`;

describe("the slots a view written as a module places", () => {
  it("are every Slot it writes, with the name and the view written in place", () => {
    expect(
      scriptPlacements(
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

  it("leave a computed view out, and report a computed or a spread name", () => {
    const read = scriptPlacements(
      react('<Slot name="price" view={props.view} /><Slot name={props.name} /><Slot {...props} />'),
      "tsx",
    );
    expect(read.placements).toEqual([{ name: "price" }]);
    expect(read.unnamed).toHaveLength(2);
  });

  it("follow the name the module imports the slot under, and no other component called Slot", () => {
    expect(
      scriptPlacements(react('<Place name="cart" />', "Slot as Place"), "tsx").placements,
    ).toEqual([{ name: "cart", view: "default" }]);
    const own = `import { Slot } from "./slot.js";\nexport default () => <Slot name="cart" />;`;
    expect(scriptPlacements(own, "tsx").placements).toEqual([]);
  });

  it("are read under a namespace the module imports the whole of a renderer's client as", () => {
    const react = `import * as client from "@assemblejs/renderer-react/client";\nexport default (props: { name: string }) => <><client.Slot name="cart" view="wide" /><client.Slot name={props.name} /><client.Other name="price" /></>;`;
    const read = scriptPlacements(react, "tsx");
    expect(read.placements).toEqual([{ name: "cart", view: "wide" }]);
    expect(read.unnamed).toEqual(["<client.Slot> with a name the view computes"]);
    const lit = `import * as client from "@assemblejs/renderer-lit/client";\nimport { html } from "lit";\nexport default () => html\`<section>\${client.slot("price")}\${client["slot"]("cart")}</section>\`;`;
    expect(scriptPlacements(lit, "ts").placements).toEqual([
      { name: "price", view: "default" },
      { name: "cart", view: "default" },
    ]);
    // A namespace of anything else is not a renderer's, whatever it holds.
    const other = `import * as ui from "./ui.js";\nexport default () => <ui.Slot name="cart" />;`;
    expect(scriptPlacements(other, "tsx").placements).toEqual([]);
  });

  it("are every call of a renderer's slot() in a Lit view", () => {
    const lit = `import { slot } from "@assemblejs/renderer-lit/client";\nimport { html } from "lit";\nexport default (props: { which: string }) => html\`<section>\${slot("cart")}\${slot("price", "compact")}\${slot("badge", props.which)}\${slot(props.which)}</section>\`;`;
    const read = scriptPlacements(lit, "ts");
    expect(read.placements).toEqual([
      { name: "cart", view: "default" },
      { name: "price", view: "compact" },
      { name: "badge" },
    ]);
    expect(read.unnamed).toEqual(["slot(...) with a name the view computes"]);
  });

  it("throws for a module that cannot be compiled", () => {
    expect(() => scriptPlacements("export default <", "tsx")).toThrow();
  });
});
