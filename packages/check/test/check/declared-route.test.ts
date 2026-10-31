// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { declaredRoute, readDefaultExport } from "@asmjs/check";

const route = async (source: string) => declaredRoute(await readDefaultExport(source), "/shop");

describe("the route a page's declaration gives it", () => {
  it("is the one it writes", async () => {
    expect(await route('export default { route: "/store" };')).toBe("/store");
    expect(await route('export default definePage({ route: "/store/:id", place: {} });')).toBe(
      "/store/:id",
    );
  });

  it("is the one its directory implies where the declaration writes none", async () => {
    expect(await route("export default { place: {} };")).toBe("/shop");
    expect(await route("export default 5;")).toBe("/shop");
  });

  it("is unknown for one the declaration computes, or a declaration computed whole", async () => {
    expect(await route('const at = "/s" + name;\nexport default { route: at };')).toBeUndefined();
    expect(await route("export default { route: 5 };")).toBeUndefined();
    expect(await route("export default makePage();")).toBeUndefined();
    expect(await route("export default { ...base, place: {} };")).toBeUndefined();
    // No default export: the build's import of one would refuse it, so no route is known here.
    expect(await route("export const other = 1;")).toBeUndefined();
  });
});
