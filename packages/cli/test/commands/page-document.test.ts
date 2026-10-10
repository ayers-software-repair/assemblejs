// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { findPlacements } from "@assemblejs/core";
import { describe, expect, it } from "vitest";
import { pageDocument, placeAssembly, projectFiles } from "@assemblejs/cli";

describe("a page's whole document, as the starter writes one", () => {
  it("is what every page needs, titled, placing what it is given in the order given", () => {
    expect(pageDocument("shop", ["header", "cart"])).toBe(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>shop</title>
  </head>
  <body>
    <assembly name="header"></assembly>
    <assembly name="cart"></assembly>
  </body>
</html>
`);
  });

  it("is the page a new project is written with", () => {
    expect(projectFiles("shop")["src/pages/home/home.html"]).toBe(pageDocument("shop", ["hello"]));
  });

  // The page a person asks an agent to make starts with nothing placed, and takes a placement.
  it("places nothing when it is given nothing, and is a template a placement can be put into", () => {
    const empty = pageDocument("about");
    expect(findPlacements(empty)).toEqual([]);
    expect(empty).toContain("  <body>\n  </body>\n");
    const placed = placeAssembly(empty, "hello", { at: "end" }, "src/pages/about/about.html");
    expect(
      "template" in placed && findPlacements(placed.template).map((found) => found.name),
    ).toEqual(["hello"]);
  });
});
