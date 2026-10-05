// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { parse } from "acorn";
import type { Expression, ExpressionStatement } from "acorn";
import { describe, expect, it } from "vitest";
import { UNWRITTEN, literalOf } from "@assemblejs/cli";

const of = (source: string) => {
  const [statement] = parse(source, { ecmaVersion: "latest", sourceType: "module" }).body;
  return literalOf((statement as ExpressionStatement).expression as Expression);
};

describe("what an expression is, as far as it is written", () => {
  it("keeps every kind of literal as written, a negated number and null included", () => {
    expect(of('"a"')).toBe("a");
    expect(of("800")).toBe(800);
    expect(of("-1")).toBe(-1);
    expect(of("true")).toBe(true);
    expect(of("null")).toBeNull();
    expect(of("`plain`")).toBe("plain");
    expect(of('({ a: 1, "b": [2, null], 5: true })')).toStrictEqual({
      a: 1,
      b: [2, null],
      5: true,
    });
  });

  it("reads anything computed as undefined, known only to be there", () => {
    expect(of("x")).toBeUndefined();
    expect(of("f()")).toBeUndefined();
    expect(of("`${x}`")).toBeUndefined();
    expect(of("-x")).toBeUndefined();
    expect(of("!true")).toBeUndefined();
    expect(of("/re/")).toBeUndefined();
    expect(of("10n")).toBeUndefined();
    expect(of("({ a: x, [k]: 1, ...rest })")).toStrictEqual({ a: undefined, [UNWRITTEN]: true });
    expect(UNWRITTEN in (of("({ a: 1 })") as object)).toBe(false);
    expect(of("[x, ...rest, 1]")).toStrictEqual([undefined, undefined, 1]);
  });
});
