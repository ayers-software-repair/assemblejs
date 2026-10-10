// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { templatePlacements } from "@assemblejs/cli";

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

  it("are not read from Pug, nor from a source that is not one once the engine's parts are out", () => {
    expect(
      templatePlacements("pug", 'section\n  assembly(name="cart")').placements,
    ).toBeUndefined();
    expect(
      templatePlacements(
        "handlebars",
        '<assembly name="cart" {{#if x}}view="wide"{{/if}}></assembly>',
      ).placements,
    ).toBeUndefined();
  });
});
