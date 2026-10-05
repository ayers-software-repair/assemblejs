// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { findPlacements, remotePlacementProblems } from "@assemblejs/core";

const origins = new Set(["https://shop.example"]);
const held = (template: string, url: string) => {
  const [placement] = findPlacements(template);
  if (placement === undefined) throw new Error("the template places nothing");
  return remotePlacementProblems('page "/"', template, placement, url, origins);
};
const cart = '<assembly name="cart"></assembly>';

describe("what is wrong with a placement from another server", () => {
  it("finds nothing wrong with a declared remote's content endpoint outside any form", () => {
    expect(held(cart, "https://shop.example/assembly/cart/")).toEqual([]);
    expect(held(`<form></form>${cart}`, "https://shop.example/assembly/cart/wide/")).toEqual([]);
  });

  it("refuses a url that is not an assembly's content endpoint", () => {
    expect(held(cart, "https://shop.example/cart")).toEqual([
      {
        name: "cart",
        about: "url",
        message:
          'page "/" places "cart" from https://shop.example/cart, which is not an assembly\'s content endpoint (https://host/assembly/<name>/)',
      },
    ]);
  });

  it("refuses an origin nobody declared", () => {
    expect(held(cart, "https://other.example/assembly/cart/")).toEqual([
      {
        name: "cart",
        about: "origin",
        message:
          'page "/" places "cart" from https://other.example, which is not a declared remote',
      },
    ]);
  });

  it("refuses a placement inside one of the page's forms, whatever its url", () => {
    const problems = held(`<form>${cart}</form>`, "https://other.example/assembly/cart/");
    expect(problems.map((problem) => problem.about)).toEqual(["origin", "form"]);
    expect(problems[1]?.message).toMatch(/inside a <form>/);
  });
});
