// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { pageDocument, placeAssembly } from "@assemblejs/cli";

const CART = '<assembly name="cart"></assembly>';
const NAV = '<assembly name="nav"></assembly>';
const file = "src/pages/home/home.html";
type Position = Parameters<typeof placeAssembly>[2];
/** The template with the cart placed in it, or the problem's sentence. */
const place = (template: string, position: Position): string => {
  const placed = placeAssembly(template, "cart", position, file);
  return "template" in placed ? placed.template : placed.problem.message;
};
const ended = (text: string): string => text.replaceAll("\n", "\r\n");

describe("putting a placement into a page template", () => {
  // The starter's own page is the layout the writer is held to: what it writes into one is,
  // byte for byte, what the starter writes for a page that places the assembly.
  it("writes into the starter's page what the starter would have written", () => {
    const page = pageDocument("shop", ["hello"]);
    expect(place(page, { at: "end" })).toBe(pageDocument("shop", ["hello", "cart"]));
    expect(place(page, { at: "start" })).toBe(pageDocument("shop", ["cart", "hello"]));
    expect(place(page, { after: "hello" })).toBe(pageDocument("shop", ["hello", "cart"]));
    expect(place(page, { before: "hello" })).toBe(pageDocument("shop", ["cart", "hello"]));
    expect(place(pageDocument("shop"), { at: "end" })).toBe(pageDocument("shop", ["cart"]));
    expect(place(pageDocument("shop"), { at: "start" })).toBe(pageDocument("shop", ["cart"]));
  });

  it("ends the line it writes as the file ends its lines", () => {
    const page = ended(pageDocument("shop", ["hello"]));
    expect(place(page, { at: "end" })).toBe(ended(pageDocument("shop", ["hello", "cart"])));
    expect(place(page, { at: "start" })).toBe(ended(pageDocument("shop", ["cart", "hello"])));
    expect(place(page, { after: "hello" })).toBe(ended(pageDocument("shop", ["hello", "cart"])));
    expect(place(page, { before: "hello" })).toBe(ended(pageDocument("shop", ["cart", "hello"])));
    expect(place(ended(pageDocument("shop")), { at: "end" })).toBe(
      ended(pageDocument("shop", ["cart"])),
    );
  });

  it("indents as the file does, with tabs or with nothing", () => {
    expect(place(`<body>\n\t<main></main>\n</body>`, { at: "end" })).toBe(
      `<body>\n\t<main></main>\n\t${CART}\n</body>`,
    );
    expect(place(`<html>\n\t<body>\n\t</body>\n</html>`, { at: "end" })).toBe(
      `<html>\n\t<body>\n\t\t${CART}\n\t</body>\n</html>`,
    );
    expect(place(`<html>\n<body>\n</body>\n</html>`, { at: "start" })).toBe(
      `<html>\n<body>\n${CART}\n</body>\n</html>`,
    );
  });

  it("writes it inline where what it stands beside shares its line", () => {
    expect(place(`<div>${NAV}</div>`, { after: "nav" })).toBe(`<div>${NAV}${CART}</div>`);
    expect(place(`<div>${NAV}</div>`, { before: "nav" })).toBe(`<div>${CART}${NAV}</div>`);
    expect(place("<body><main></main></body>", { at: "start" })).toBe(
      `<body>${CART}<main></main></body>`,
    );
    expect(place("<body><main></main></body>", { at: "end" })).toBe(
      `<body><main></main>${CART}</body>`,
    );
    expect(place("<body></body>", { at: "end" })).toBe(`<body>${CART}</body>`);
  });

  it("writes into a view, which has no body, above its first line or beneath its last", () => {
    const view = "<section>\n  <h2>Basket</h2>\n</section>\n";
    expect(place(view, { at: "start" })).toBe(`${CART}\n${view}`);
    expect(place(view, { at: "end" })).toBe(`${view}${CART}\n`);
    // A file that does not end its last line is not given an ending it did not have.
    expect(place("<main></main>", { at: "end" })).toBe(`<main></main>\n${CART}`);
    expect(place("<main></main>", { at: "start" })).toBe(`${CART}\n<main></main>`);
    expect(place("", { at: "end" })).toBe(`${CART}\n`);
  });

  // Anything before a doctype puts the browser in quirks mode, and a body the template leaves
  // unwritten begins after its head.
  it("begins a body the template does not write after its doctype and its head", () => {
    expect(place("<!doctype html>\n<main></main>\n", { at: "start" })).toBe(
      `<!doctype html>\n${CART}\n<main></main>\n`,
    );
    const headed = "<!doctype html>\n<html>\n  <head><title>x</title></head>\n  <main></main>\n";
    expect(place(`${headed}</html>\n`, { at: "start" })).toBe(
      `${headed.replace("  <main>", `  ${CART}\n  <main>`)}</html>\n`,
    );
    expect(place(`${headed}</html>\n`, { at: "end" })).toBe(`${headed}  ${CART}\n</html>\n`);
    expect(place("<html>\n  <head></head>\n</html>\n", { at: "end" })).toBe(
      `<html>\n  <head></head>\n  ${CART}\n</html>\n`,
    );
  });

  it("keeps a byte order mark first in the file", () => {
    const mark = String.fromCharCode(0xfeff);
    expect(place(`${mark}<main></main>`, { at: "start" })).toBe(`${mark}${CART}\n<main></main>`);
  });

  it("finds the body a reader would, past comments, scripts, case and quoted attributes", () => {
    const tricky =
      '<!-- <body> --><html><BODY data-a=">"><script>var s="</body>"</script>\n</BODY></html>';
    expect(place(tricky, { at: "start" })).toContain(`<BODY data-a=">">${CART}<script>`);
    expect(place(tricky, { at: "end" })).toContain(`</script>\n${CART}\n</BODY>`);
  });

  it("reads a tag by its whole name, and no tag inside another's attribute", () => {
    // An element whose name begins with body is not the body.
    expect(place("<body-card>\n</body-card>\n<main></main>\n", { at: "start" })).toBe(
      `${CART}\n<body-card>\n</body-card>\n<main></main>\n`,
    );
    expect(place('<div title="<body>"></div>\n<main></main>\n', { at: "start" })).toBe(
      `${CART}\n<div title="<body>"></div>\n<main></main>\n`,
    );
    expect(place('<main></main>\n<div title="</body>"></div>\n', { at: "end" })).toBe(
      `<main></main>\n<div title="</body>"></div>\n${CART}\n`,
    );
  });

  it("puts it beside an assembly the template already places", () => {
    const page = `<html><body>\n${NAV}\n<main></main>\n</body></html>`;
    expect(place(page, { after: "nav" })).toContain(`${NAV}\n${CART}\n<main>`);
    expect(place(page, { before: "nav" })).toContain(`<body>\n${CART}\n${NAV}`);
    const nested = `<body>\n  <header>\n    ${NAV}\n  </header>\n</body>\n`;
    expect(place(nested, { after: "nav" })).toBe(nested.replace(NAV, `${NAV}\n    ${CART}`));
  });

  it("says how many times the template places it now, as a second placing may not be meant", () => {
    const once = placeAssembly(`<body>\n${NAV}\n</body>`, "cart", { at: "end" }, file);
    expect(once).toMatchObject({ placed: 1 });
    const again = placeAssembly(`<body>\n${CART}\n</body>`, "cart", { at: "end" }, file);
    expect(again).toMatchObject({ placed: 2 });
  });

  it("refuses a neighbour the template does not place, listing the ones it does", () => {
    const placed = placeAssembly(`<body>\n${NAV}\n</body>`, "cart", { after: "footer" }, file);
    expect(placed).toMatchObject({
      problem: {
        rule: "a-placement-names-an-assembly",
        message: 'the template does not place "footer"',
        fix: "place it beside one it does: nav",
      },
    });
  });

  it("refuses a template it cannot read, wherever it was asked to put it", () => {
    const unread = '<body><assembly nam="nav"></assembly></body>';
    for (const position of [{ after: "nav" }, { at: "end" }, { at: "start" }] as const) {
      expect(placeAssembly(unread, "cart", position, file)).toMatchObject({
        problem: { rule: "a-placement-names-an-assembly" },
      });
    }
  });
});
