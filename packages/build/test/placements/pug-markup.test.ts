// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { findPlacements } from "@asmjs/core";
import { describe, expect, it } from "vitest";
import { loadPug, pugMarkup, pugTree } from "@asmjs/build";

const templates = fileURLToPath(new URL("../../../../examples/templates/", import.meta.url));
// Each source through the installed Pug's own parser, so the trees are the ones a project's are.
const markup = (source: string): string => {
  const pug = loadPug(templates);
  if (pug === undefined) throw new Error("the templates example has no Pug installed");
  const tree = pugTree(pug, source);
  if (tree === undefined) throw new Error(`Pug did not compile: ${source}`);
  return pugMarkup(tree, "computed");
};
const placed = (source: string) =>
  findPlacements(markup(source)).map(({ name, view }) => ({ name, view }));
const PRICE = [{ name: "price", view: "default" }];

describe("a Pug template as the markup its directives are written in", () => {
  it("writes a directive tag as Pug writes it, wherever in the template it stands", () => {
    expect(markup('section.nest\n  assembly(name="price")')).toBe(
      '<section class="nest"><assembly name="price"></assembly></section>',
    );
    expect(placed('assembly(name="price" view="wide")/')).toEqual([
      { name: "price", view: "wide" },
    ]);
    expect(placed("assembly(name='price')")).toEqual(PRICE);
    expect(placed("assembly(name=`price`)")).toEqual(PRICE);
    expect(placed('div before #[assembly(name="price")] after')).toEqual(PRICE);
    expect(placed('each one in data.list\n  assembly(name="price")')).toEqual(PRICE);
    expect(placed('mixin card\n  assembly(name="price")\n+card')).toEqual(PRICE);
    expect(placed('- if (data.open)\n  assembly(name="price")')).toEqual(PRICE);
    // A name alone is its own value, as Pug writes it: an assembly named "name".
    expect(placed("assembly(name)")).toEqual([{ name: "name", view: "default" }]);
    expect(placed('if data.open\n  assembly(name="cart")\nelse\n  assembly(name="price")')).toEqual(
      [{ name: "cart", view: "default" }, ...PRICE],
    );
  });

  it("stands the marker wherever the template computes what it writes", () => {
    expect(placed('assembly(name="price" view=data.as)')).toEqual([
      { name: "price", view: "computed" },
    ]);
    expect(placed("assembly(name=data.which)")).toEqual([{ name: "computed", view: "default" }]);
    expect(placed('assembly(name="pri" + "ce")')).toEqual([{ name: "computed", view: "default" }]);
    expect(placed('mixin card(n)\n  assembly(name=n)\n+card("price")')).toEqual([
      { name: "computed", view: "default" },
    ]);
    expect(placed('div\n  | <assembly name="#{data.n}"></assembly>')).toEqual([
      { name: "computed", view: "default" },
    ]);
  });

  it("keeps a directive written as markup: a line of html, or text", () => {
    expect(placed('<assembly name="price"></assembly>')).toEqual(PRICE);
    expect(placed('div\n  | <assembly name="price"></assembly>')).toEqual(PRICE);
  });

  it("writes what makes a directive unreadable, for the one reader of directives to refuse", () => {
    expect(() => placed('assembly(name="price") words')).toThrow(/immediately closed/);
    expect(() => placed('assembly(name="price")&attributes(data.more)')).toThrow(/cannot read/);
    expect(() => placed('assembly.wide(name="price")')).toThrow(/unknown attribute "class"/);
  });

  it("takes for a directive nothing a render alone knows, and nothing the parser reads as text", () => {
    // A tag whose own name is computed is no directive here, whatever a render makes of it.
    expect(placed('#{data.tag}(name="price")')).toEqual([]);
    expect(placed(".raw !{data.note}")).toEqual([]);
    expect(placed("p= data.title")).toEqual([]);
    expect(placed('// <assembly name="price"></assembly>')).toEqual([]);
    expect(placed('//\n  <assembly name="price"></assembly>')).toEqual([]);
    expect(placed("script.\n  const s = '<assembly name=\"price\"></assembly>';")).toEqual([]);
    expect(placed("div(title=\"<assembly name='price'/>\")")).toEqual([]);
  });

  // Found 2026-10-11. Only a directive's attributes were written, so every rule that reads an
  // element's attributes read a Pug view as having none: an img with an alt had none, an input
  // with a label had none, and an inline style was never seen.
  it("writes every tag's attributes, as a render writes them", () => {
    expect(markup('img(src="a.png" alt="A stoneware cup")')).toBe(
      '<img src="a.png" alt="A stoneware cup"></img>',
    );
    expect(markup('input#q.wide(aria-label="Search the shop" required)')).toBe(
      '<input id="q" class="wide" aria-label="Search the shop" required="required"></input>',
    );
    expect(markup('p(style="color:red") hi')).toBe('<p style="color:red">hi</p>');
    // What the template computes stands as the marker, in a value or as the attributes whole.
    expect(markup("img(alt=data.name)")).toBe('<img alt="computed"></img>');
    expect(markup("div&attributes(data.more)")).toBe("<div computed></div>");
  });

  it("escapes a written value as a render does, so markup in an attribute is not markup", () => {
    expect(markup("a(title='<assembly name=\"price\"/> & more') t")).toBe(
      '<a title="&lt;assembly name=&quot;price&quot;/&gt; &amp; more">t</a>',
    );
    expect(placed("a(title='<assembly name=\"price\"></assembly>') t")).toEqual([]);
  });
});
