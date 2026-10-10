// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { fieldsOf, readDefaultExport } from "@assemblejs/cli";

describe("the entries of a value its source writes as an object", () => {
  it("are the object itself", () => {
    const declared = readDefaultExport('export default { route: "/shop" };');
    expect(fieldsOf(declared)).toBe(declared);
    expect(fieldsOf(declared)?.["route"]).toBe("/shop");
  });

  it("are undefined for an array, a null, a word or a value that is computed", () => {
    for (const source of [
      "export default [1, 2];",
      "export default null;",
      'export default "words";',
      "export default made();",
      "export const other = 1;",
    ]) {
      expect(fieldsOf(readDefaultExport(source)), source).toBeUndefined();
    }
  });
});
