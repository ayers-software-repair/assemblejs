// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { withoutAbsentMembers } from "@assemblejs/core";

describe("dropping a returned object's absent members", () => {
  it("removes the key, not only the value", () => {
    const dropped = withoutAbsentMembers({ a: 1, b: undefined });
    expect(Object.keys(dropped)).toEqual(["a"]);
  });

  it("goes through objects and arrays at every depth", () => {
    const returned = {
      list: [{ a: 1, b: undefined }, [{ c: undefined }]],
      deep: { e: undefined },
    };
    expect(withoutAbsentMembers(returned)).toEqual({ list: [{ a: 1 }, [{}]], deep: {} });
  });

  it("keeps what is present, falsy values and null included", () => {
    const kept = { zero: 0, no: false, empty: "", nothing: null, list: [] };
    expect(withoutAbsentMembers(kept)).toEqual(kept);
  });

  it("makes a key named __proto__ a member, never a prototype", () => {
    const returned = withoutAbsentMembers(JSON.parse('{"__proto__":{"x":1}}'));
    expect(Object.keys(returned)).toEqual(["__proto__"]);
    expect(Object.getPrototypeOf(returned)).toBe(Object.prototype);
  });

  it("says what JSON says", () => {
    const returned = { a: [{ b: undefined, c: 2 }], d: undefined };
    expect(withoutAbsentMembers(returned)).toEqual(JSON.parse(JSON.stringify(returned)));
  });
});
