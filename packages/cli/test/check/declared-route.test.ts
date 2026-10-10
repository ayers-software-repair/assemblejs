// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { declaredRoute, readDefaultExport } from "@assemblejs/cli";

const route = (source: string) => declaredRoute(readDefaultExport(source), "/shop");

describe("the route a page's declaration gives it", () => {
  it("is the one it writes", () => {
    expect(route('export default { route: "/store" };')).toBe("/store");
    expect(route('export default definePage({ route: "/store/:id", place: {} });')).toBe(
      "/store/:id",
    );
  });

  it("is the one its directory implies where the declaration writes none", () => {
    expect(route("export default { place: {} };")).toBe("/shop");
    expect(route("export const other = 1;")).toBe("/shop");
  });

  it("is unknown for one the declaration computes", () => {
    expect(route('const at = "/s" + name;\nexport default { route: at };')).toBeUndefined();
    expect(route("export default { route: 5 };")).toBeUndefined();
  });
});
