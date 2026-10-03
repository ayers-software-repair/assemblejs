// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { placeAssembly } from "@assemblejs/cli";

const page = '<html><body>\n<assembly name="nav"></assembly>\n<main></main>\n</body></html>';
const place = (position: Parameters<typeof placeAssembly>[2], template = page) =>
  placeAssembly(template, "cart", position, "src/pages/home/home.html");

describe("putting a placement into a page template", () => {
  it("puts it at the start or the end of the body", () => {
    expect(place({ at: "start" })).toEqual({
      template: page.replace("<body>", '<body>\n<assembly name="cart"></assembly>'),
    });
    expect(place({ at: "end" })).toEqual({
      template: page.replace("</body>", '<assembly name="cart"></assembly>\n</body>'),
    });
  });

  it("puts it beside an assembly the template already places", () => {
    const after = place({ after: "nav" });
    expect("template" in after && after.template).toContain(
      '<assembly name="nav"></assembly>\n<assembly name="cart"></assembly>',
    );
    const before = place({ before: "nav" });
    expect("template" in before && before.template).toContain(
      '<assembly name="cart"></assembly>\n<assembly name="nav"></assembly>',
    );
  });

  it("refuses a neighbour the template does not place, listing the ones it does", () => {
    expect(place({ after: "footer" })).toMatchObject({
      problem: {
        rule: "a-placement-names-an-assembly",
        message: 'the template does not place "footer"',
        fix: "place it beside one it does: nav",
      },
    });
  });

  it("refuses a template it cannot read, rather than guessing where to put it", () => {
    expect(place({ after: "nav" }, '<body><assembly nam="nav"></assembly></body>')).toMatchObject({
      problem: { rule: "a-placement-names-an-assembly" },
    });
  });

  it("still places into a template with no body", () => {
    expect(place({ at: "end" }, "<main></main>")).toEqual({
      template: '<main></main><assembly name="cart"></assembly>\n',
    });
  });
});
