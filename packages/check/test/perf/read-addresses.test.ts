// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { readAddresses } from "@assemblejs/check";

describe("the page addresses a config declares", () => {
  it("reads each route's address as written, and none from a config that declares none", () => {
    expect(
      readAddresses(
        'export default defineConfig({ addresses: { "/p/:sku": "/p/kettle-1", "/c/:category": "/c/beans" } });',
      ),
    ).toEqual({
      addresses: { "/p/:sku": "/p/kettle-1", "/c/:category": "/c/beans" },
      whole: true,
      problems: [],
    });
    expect(readAddresses("export default defineConfig({ remotes: [] });")).toEqual({
      addresses: {},
      whole: true,
      problems: [],
    });
    expect(readAddresses("")).toEqual({ addresses: {}, whole: true, problems: [] });
  });

  it("refuses addresses that are not an object of routes and paths written as literals", () => {
    const refused = (source: string) => readAddresses(source).problems;
    expect(refused('export default { addresses: { "/p/:sku": 5 } }')).toEqual([
      'the address for "/p/:sku" is not written as a string; write it as a path',
    ]);
    expect(refused('export default { addresses: { "/p/:sku": process.env.A } }')).toEqual([
      'the address for "/p/:sku" is not written as a string; write it as a path',
    ]);
    expect(refused("export default { addresses: 5 }")).toEqual([
      "addresses is not an object of routes and paths",
    ]);
    expect(refused("export default { addresses: shared }")).toEqual([
      "addresses is not written as an object of routes and paths; write it as one",
    ]);
    expect(refused('export default { addresses: { "/p/:sku": "/p/a", ...more } }')).toEqual([
      "addresses has a spread or a computed key; write every route as its name and address",
    ]);
  });

  it("does not know whether a config built by a spread or a call declares any, and does not say so twice", () => {
    for (const source of ["export default { ...base };", "export default defineConfig(load());"]) {
      expect(readAddresses(source), source).toEqual({ addresses: {}, whole: false, problems: [] });
    }
    expect(readAddresses('export default { ...base, addresses: { "/p/:sku": "/p/a" } };')).toEqual({
      addresses: { "/p/:sku": "/p/a" },
      whole: true,
      problems: [],
    });
  });
});
