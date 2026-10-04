// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { apiRoute } from "@assemblejs/cli";

const api = (source: string): string => {
  const file = join(mkdtempSync(join(tmpdir(), "api-route-")), "x.api.ts");
  writeFileSync(file, source);
  return file;
};

describe("the route an api answers GET at", () => {
  it("is its path, for an api of no method or of GET", () => {
    expect(apiRoute(api('export default defineApi({ path: "/about", handle: () => ({}) });'))).toBe(
      "/about",
    );
    expect(apiRoute(api('export default { path: "/a/:id", method: "GET" };'))).toBe("/a/:id");
  });

  it("is nothing for another method, or a path the file computes", () => {
    expect(apiRoute(api('export default { path: "/about", method: "POST" };'))).toBeUndefined();
    expect(apiRoute(api("const p = `/${1}`;\nexport default { path: p };"))).toBeUndefined();
  });
});
