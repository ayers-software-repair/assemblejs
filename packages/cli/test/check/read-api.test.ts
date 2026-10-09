// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readApi } from "@assemblejs/cli";

const api = (source: string): string => {
  const file = join(mkdtempSync(join(tmpdir(), "read-api-")), "x.api.ts");
  writeFileSync(file, source);
  return file;
};

describe("an api file's route, read from its source", () => {
  it("is its path and method, GET when it names none, and whether it streams", () => {
    expect(
      readApi(api('export default defineApi({ path: "/about", handle: () => ({}) });')),
    ).toMatchObject({
      path: "/about",
      method: "GET",
    });
    const posted = readApi(
      api('export default { path: "/a/:id", method: "POST", handle: () => 1 };'),
    );
    expect(posted).toMatchObject({ path: "/a/:id", method: "POST" });
    expect(posted !== undefined && "handle" in posted).toBe(true);
    const streamed = readApi(api('export default { path: "/s", stream: () => undefined };'));
    expect(streamed !== undefined && "stream" in streamed).toBe(true);
  });

  it("is nothing for a path or a method the file computes", () => {
    expect(readApi(api("const p = `/${1}`;\nexport default { path: p };"))).toBeUndefined();
    expect(
      readApi(api('const m = "GET";\nexport default { path: "/x", method: m };')),
    ).toBeUndefined();
  });
});
