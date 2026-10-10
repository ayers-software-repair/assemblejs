// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COMPUTED, UNREAD, readApiShape, realIo } from "@assemblejs/cli";

const api = (source: string) => {
  const root = mkdtempSync(join(tmpdir(), "api-shape-"));
  const file = join(root, "src", "api", "prices.api.ts");
  realIo.write(file, source);
  return readApiShape(root, file);
};

describe("one api file's route, read from its source", () => {
  it("is its path and its method, GET where it names none, and that it answers once", () => {
    expect(
      api(
        'import { defineApi } from "@assemblejs/core";\nexport default defineApi({ path: "/api/prices", handle: () => ({}) });',
      ),
    ).toEqual({
      file: "src/api/prices.api.ts",
      path: "/api/prices",
      method: "GET",
      streams: false,
    });
    expect(
      api('export default { path: "/api/push", method: "POST", handle: () => null };'),
    ).toMatchObject({ path: "/api/push", method: "POST", streams: false });
  });

  it("streams where it declares a stream in place of a handler", () => {
    expect(
      api('export default { path: "/api/prices", stream: ({ send }) => send("p", 1) };'),
    ).toMatchObject({ path: "/api/prices", method: "GET", streams: true });
  });

  it("marks a path or a method the file computes, and a file computed whole", () => {
    expect(api('export default { path: "/api/" + name, method: verb, handle };')).toMatchObject({
      path: COMPUTED,
      method: COMPUTED,
      streams: false,
    });
    expect(api("export default routeFor(prices);")).toMatchObject({
      path: COMPUTED,
      method: COMPUTED,
      streams: COMPUTED,
    });
  });

  it("marks what a spread may bring in, and says a missing path is missing", () => {
    expect(api('export default { ...base, path: "/api/prices" };')).toMatchObject({
      path: "/api/prices",
      method: COMPUTED,
      streams: COMPUTED,
    });
    expect(api("export default { handle: () => null };")).toMatchObject({ path: null });
  });

  it("marks every part of a file that cannot be read", () => {
    expect(api("export default { path: ")).toEqual({
      file: "src/api/prices.api.ts",
      path: UNREAD,
      method: UNREAD,
      streams: UNREAD,
    });
  });
});
