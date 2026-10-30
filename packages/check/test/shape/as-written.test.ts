// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPUTED, asWritten, readDefaultExport } from "@asmjs/check";

const shown = async (source: string) => asWritten(await readDefaultExport(source));

describe("a value read from source, as it is shown", () => {
  it("is every literal as written", async () => {
    expect(
      await shown('export default { a: 1, b: "two", c: true, d: null, e: -3, f: ["x", 2] };'),
    ).toEqual({
      a: 1,
      b: "two",
      c: true,
      d: null,
      e: -3,
      f: ["x", 2],
    });
  });

  it("marks what is computed where it stands, at any depth, and leaves nothing out", async () => {
    expect(
      await shown(
        'const ms = 400 * 2;\nexport default { timeout: ms, place: { cart: { url: remote("cart"), defer: true } }, list: [1, ms, ...more] };',
      ),
    ).toEqual({
      timeout: COMPUTED,
      place: { cart: { url: COMPUTED, defer: true } },
      list: [1, COMPUTED, COMPUTED],
    });
    expect(await shown("export default settings();")).toBe(COMPUTED);
  });

  it("says an object brings in entries it does not name, beside the ones it does", async () => {
    expect(
      await shown("export default { ...shared, a: 1, [key]: 2, inner: { ...more } };"),
    ).toEqual({
      a: 1,
      inner: { "...": COMPUTED },
      "...": COMPUTED,
    });
  });

  it("is what JSON carries: no symbol and nothing undefined is left in it", async () => {
    const written = await shown("export default { ...shared, a: later(), b: [later()] };");
    expect(JSON.parse(JSON.stringify(written))).toEqual(written);
  });
});
