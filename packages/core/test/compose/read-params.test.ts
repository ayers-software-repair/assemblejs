// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { encodeParams, readParams } from "@assemblejs/core";

describe("a page's parameters read back from the wire", () => {
  it("reads what was encoded, values of any text, and nothing from an empty string", () => {
    const params = { id: "42", slug: "a b&c=d", under_score: "" };
    expect(readParams(encodeParams(params))).toEqual({ ok: true, params });
    expect(readParams("")).toEqual({ ok: true, params: {} });
  });

  it("keeps a parameter named like a property of every object as a key of its own", () => {
    const read = readParams("__proto__=1&constructor=2");
    expect(read.ok && Object.hasOwn(read.params, "__proto__")).toBe(true);
    expect(read.ok && read.params["constructor"]).toBe("2");
    expect(read.ok && Object.getPrototypeOf(read.params)).toBeNull();
    expect(readParams("__proto__=1&__proto__=2")).toMatchObject({ ok: false });
  });

  it("refuses a name that is not a parameter's, a name given twice, and too much of it", () => {
    expect(readParams("1x=1")).toEqual({
      ok: false,
      detail: 'names "1x", which is not a parameter',
    });
    expect(readParams("a-b=1")).toMatchObject({ ok: false });
    expect(readParams("=1")).toMatchObject({ ok: false });
    expect(readParams("id=1&id=2")).toEqual({ ok: false, detail: 'names "id" twice' });
    expect(readParams(`id=${"x".repeat(2048)}`)).toEqual({
      ok: false,
      detail: "is longer than 2048 bytes",
    });
  });
});
