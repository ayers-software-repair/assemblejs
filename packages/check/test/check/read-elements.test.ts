// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { COMPUTED_MARKER } from "@assemblejs/build";
import { describe, expect, it } from "vitest";
import { readElements } from "@assemblejs/check";

const tags = (markup: string) => readElements(markup).map((element) => element.tag);

describe("the elements markup writes", () => {
  it("reads each start tag with its attributes: quoted, unquoted and bare, names lower-cased", () => {
    const [input, img] = readElements(
      '<INPUT Type="text" name=\'who\' size=4 required><img src=a.png alt="" />',
    );
    expect(input?.tag).toBe("input");
    expect([...(input?.attributes ?? [])]).toEqual([
      ["type", "text"],
      ["name", "who"],
      ["size", "4"],
      ["required", true],
    ]);
    expect(img?.tag).toBe("img");
    expect(img?.attributes.get("alt")).toBe("");
    expect(img?.at).toBe(46);
  });

  it("passes over what the parser reads as text: a comment, a script, a style, a textarea, a title", () => {
    expect(
      tags(
        '<!-- <img> --><script>"<img>"</script><style>a{}</style><textarea><b></textarea><title><i></title><p>',
      ),
    ).toEqual(["script", "style", "textarea", "title", "p"]);
  });

  it("reads end tags as nothing, the first of a repeated attribute as its value, and a computed tag as computed", () => {
    expect(tags("<ul><li>one</li><li>two</li></ul>")).toEqual(["ul", "li", "li"]);
    const [button] = readElements('<button class="a" class="b">');
    expect(button?.attributes.get("class")).toBe("a");
    const [computed, plain] = readElements(`<img src="${COMPUTED_MARKER}"><p>`);
    expect(computed?.computed).toBe(true);
    expect(plain?.computed).toBe(false);
  });

  it("reads nothing from markup with no tags, and the directive as an element like any other", () => {
    expect(readElements("just text")).toEqual([]);
    expect(tags('<assembly name="cart"></assembly>')).toEqual(["assembly"]);
  });
});
