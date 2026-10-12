// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { requestedPath } from "@assemblejs/core";

describe("the path a request asked for, as the router reads it", () => {
  it("is the path without its query, as written, when nothing in it is encoded", () => {
    expect(requestedPath("/admin/users?page=2")).toBe("/admin/users");
    expect(requestedPath("/")).toBe("/");
    expect(requestedPath("/assembly/cart/default/api/")).toBe("/assembly/cart/default/api/");
  });

  it("is the address an encoded spelling spells, each segment decoded once", () => {
    expect(requestedPath("/%61dmin/users")).toBe("/admin/users");
    expect(requestedPath("/assembly/secre%74/")).toBe("/assembly/secret/");
    expect(requestedPath("/item/a%20b?x=%61")).toBe("/item/a b");
    // Once: what an encoded percent sign leaves is not decoded again, as the router does not.
    expect(requestedPath("/%2561dmin")).toBe("/%61dmin");
  });

  it("keeps an encoded slash encoded, so decoding never joins two segments or splits one", () => {
    expect(requestedPath("/item/a%2Fb")).toBe("/item/a%2Fb");
    expect(requestedPath("/assembly/open%2f..%2fsecret/")).toBe("/assembly/open%2F..%2Fsecret/");
  });

  it("is none for a segment that does not decode, which the router refuses as well", () => {
    expect(requestedPath("/%zz")).toBeUndefined();
    expect(requestedPath("/admin/%")).toBeUndefined();
    expect(requestedPath("/%C3")).toBeUndefined();
  });
});
