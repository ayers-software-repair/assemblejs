// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPUTED, fieldAsWritten, fieldsOf, readDefaultExport } from "@assemblejs/cli";

const field = (source: string, key: string, absent: null | string) => {
  const fields = fieldsOf(readDefaultExport(source));
  if (fields === undefined) throw new Error(`not written as an object: ${source}`);
  return fieldAsWritten(fields, key, absent);
};

describe("one field of an object read from source", () => {
  it("is as written where the object names it, computed parts marked", () => {
    expect(field('export default { method: "POST" };', "method", "GET")).toBe("POST");
    expect(field("export default { method: pick() };", "method", "GET")).toBe(COMPUTED);
  });

  it("is what its absence means where the object names every entry it has", () => {
    expect(field('export default { path: "/api/prices" };', "method", "GET")).toBe("GET");
    expect(field("export default {};", "stream", null)).toBeNull();
  });

  it("is computed where the object brings in entries unnamed, since it may be among them", () => {
    expect(field('export default { ...base, path: "/api/prices" };', "method", "GET")).toBe(
      COMPUTED,
    );
    expect(field('export default { ...base, method: "PUT" };', "method", "GET")).toBe("PUT");
  });
});
