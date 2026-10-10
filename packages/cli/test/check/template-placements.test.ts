// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadPug, templatePlacements } from "@assemblejs/cli";

// The example that installs the templates package, for the Pug a project of its own would have.
const pug = loadPug(fileURLToPath(new URL("../../../../examples/templates/", import.meta.url)));

describe("the directives a template's source holds", () => {
  it("are read past what each language computes, a computed view left out", () => {
    expect(
      templatePlacements(
        "ejs",
        '<p><%= data.title %></p><assembly name="cart"></assembly><assembly name="price" view="<%= data.priceView %>"></assembly>',
      ),
    ).toEqual({ placements: [{ name: "cart", view: "default" }, { name: "price" }], unnamed: [] });
    expect(
      templatePlacements(
        "handlebars",
        '{{#if data.open}}<assembly name="cart" view="wide"></assembly>{{/if}}{{{data.raw}}}',
      ).placements,
    ).toEqual([{ name: "cart", view: "wide" }]);
    expect(
      templatePlacements(
        "nunjucks",
        '{% for one in data.all %}<assembly name="card" view="{{ one.view }}"></assembly>{% endfor %}{# <assembly name="old"></assembly> #}',
      ).placements,
    ).toEqual([{ name: "card" }]);
  });

  it("report a name the template computes, which no rule could hold before a render", () => {
    const read = templatePlacements("ejs", '<assembly name="<%= data.which %>"></assembly>');
    expect(read.placements).toEqual([]);
    expect(read.unnamed).toHaveLength(1);
  });

  it("are read from Pug through the project's own Pug, by the same rules", () => {
    expect(pug).toBeDefined();
    expect(
      templatePlacements(
        "pug",
        'section\n  assembly(name="cart")\n  assembly(name="price" view=data.as)\n  assembly(name=data.which)',
        pug,
      ),
    ).toEqual({
      placements: [{ name: "cart", view: "default" }, { name: "price" }],
      unnamed: [expect.stringContaining("a name the template computes")],
    });
  });

  it("are unread in a Pug source with no Pug to read it, or one Pug cannot compile", () => {
    expect(templatePlacements("pug", 'assembly(name="cart")').placements).toBeUndefined();
    expect(templatePlacements("pug", "p\n  - if (\n", pug).placements).toBeUndefined();
  });

  // Silence here was a view that passed check and failed at every render that reached it.
  it("refuse a directive that does not read as it is written, with nothing computed in it", () => {
    expect(() => templatePlacements("ejs", '<p><%= data.n %></p><assembly name="cart">')).toThrow(
      /^once what the template computes is set aside, <assembly> is neither self-closing nor immediately closed/,
    );
    expect(() =>
      templatePlacements("handlebars", '{{data.n}}<assembly name="cart" timeout="5"></assembly>'),
    ).toThrow(/set aside, <assembly> carries an unknown attribute "timeout"/);
    expect(() => templatePlacements("pug", 'assembly(name="cart") words', pug)).toThrow(
      /set aside, <assembly> is neither self-closing nor immediately closed/,
    );
  });

  // What is computed may be what makes it read, so it is not refused: a render knows.
  it("are unread where one that does not read holds something the template computes", () => {
    for (const [renderer, source] of [
      ["handlebars", '<assembly name="cart" {{#if x}}view="wide"{{/if}}></assembly>'],
      ["ejs", '<assembly name="cart"><%= data.inside %></assembly>'],
      ["nunjucks", '<assembly name="{{ data.a }}/{{ data.b }}"></assembly>'],
      ["pug", 'assembly(name="cart")&attributes(data.more)'],
      ["pug", 'assembly(name="cart") #{data.inside}'],
    ] as const) {
      expect(templatePlacements(renderer, source, pug), source).toEqual({
        placements: undefined,
        unnamed: [],
      });
    }
  });

  it("still refuse one written wrong that stands after one only a render knows", () => {
    expect(() =>
      templatePlacements(
        "ejs",
        '<assembly name="cart" <%= data.more %>></assembly><assembly name="price" timeout="5"></assembly>',
      ),
    ).toThrow(/carries an unknown attribute "timeout"/);
  });
});
