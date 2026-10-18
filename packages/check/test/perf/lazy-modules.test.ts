// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { lazyModules } from "@assemblejs/check";

describe("the modules a built entry loads for its assemblies", () => {
  it("maps each name to the module its import() asks for, quoted or bare as the bundler left it", () => {
    const entry =
      'import"./chunks/chunk-A.js";var r=lazyRenderer({basket:()=>import("./chunks/basket-B.js"),"basket-count":()=>import("./chunks/basket-count-C.js")});start({renderers:{}});';
    expect(lazyModules(entry)).toEqual(
      new Map([
        ["basket", "./chunks/basket-B.js"],
        ["basket-count", "./chunks/basket-count-C.js"],
      ]),
    );
  });

  it("reads the unminified map the build generates just as well", () => {
    const entry =
      'const renderer = lazyRenderer({\n  "cart": () => import("./client/cart.js"),\n});';
    expect(lazyModules(entry)).toEqual(new Map([["cart", "./client/cart.js"]]));
  });

  it("reads no import() that is not the value of a property, or whose specifier is computed", () => {
    expect(
      lazyModules(
        'import("./bare.js");const m = { a: () => import(path), b: () => 5, c: import("./now.js") };',
      ),
    ).toEqual(new Map());
  });

  it("finds nothing in a source with no import() and nothing in one that does not parse", () => {
    expect(lazyModules("export const a = 1;")).toEqual(new Map());
    expect(lazyModules('this is ( not javascript import("./x.js")')).toEqual(new Map());
  });
});
