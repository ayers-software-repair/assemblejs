// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@assemblejs/build";
import { describe, expect, it } from "vitest";
import { readElements, unnamedControls } from "@assemblejs/cli";

// Each element of the markup in one file, as the template reader writes it.
const inFile = (file: string, markup: string) =>
  readElements(markup).map((element) => ({ file, element }));
const tags = (markup: string, more: ReturnType<typeof inFile> = []) =>
  unnamedControls([...inFile("view.html", markup), ...more]).map(
    ({ element }) => `${element.tag}#${String(element.attributes.get("id") ?? "")}`,
  );

describe("the controls a view writes with no name", () => {
  it("finds an input, a select and a textarea with no label for them and no naming attribute", () => {
    expect(
      tags('<input id="a"><select id="b"></select><textarea id="c"></textarea><input>'),
    ).toEqual(["input#a", "select#b", "textarea#c", "input#"]);
  });

  it("passes a control a label names by its id, in this file or another of the view", () => {
    expect(tags('<label for="a">A</label><input id="a"><input id="b">')).toEqual(["input#b"]);
    expect(tags('<input id="a">', inFile("field.tsx", '<label htmlFor="a">A</label>'))).toEqual([]);
  });

  it("passes a control a label may wrap: one before it in its file, or one in another file", () => {
    expect(tags('<input id="a"><label>B <input id="b"></label><input id="c">')).toEqual([
      "input#a",
    ]);
    expect(tags(`<label for="${COMPUTED_MARKER}">B</label><input id="b">`)).toEqual([]);
    expect(tags('<input id="a">', inFile("field.tsx", "<label>A</label>"))).toEqual([]);
  });

  it("passes aria-label, aria-labelledby and title, written or computed, and refuses them empty", () => {
    expect(
      tags(
        `<input aria-label="A"><input aria-labelledby="h"><select title="S"></select><input aria-label="${COMPUTED_MARKER}"><input aria-label="" id="e"><input title id="f">`,
      ),
    ).toEqual(["input#e", "input#f"]);
  });

  it("passes a placeholder on a text field alone, and a value on an input of type button alone", () => {
    expect(
      tags(
        '<input placeholder="P"><textarea placeholder="T"></textarea><input type="Email" placeholder="E"><input type="checkbox" placeholder="N" id="c"><input type="button" value="Go"><input type="button" id="d">',
      ),
    ).toEqual(["input#c", "input#d"]);
  });

  it("leaves alone a hidden, submit, reset or image input, a computed type, a spread, and a button", () => {
    expect(
      tags(
        `<input type="hidden"><input type="submit"><input type="reset"><input type="image"><input type="${COMPUTED_MARKER}"><button></button>`,
      ),
    ).toEqual([]);
    const spread = {
      tag: "input",
      attributes: new Map<string, string | true>(),
      at: 0,
      computed: true,
    };
    expect(unnamedControls([{ file: "f.tsx", element: spread }])).toEqual([]);
  });

  it("leaves alone a computed id while any label has a computed for, and refuses it otherwise", () => {
    expect(
      tags(
        `<input id="${COMPUTED_MARKER}">`,
        inFile("other.html", `<label for="${COMPUTED_MARKER}">X</label>`),
      ),
    ).toEqual([]);
    expect(
      tags(`<input id="${COMPUTED_MARKER}">`, inFile("other.html", '<label for="z">Z</label>')),
    ).toEqual([`input#${COMPUTED_MARKER}`]);
  });
});
