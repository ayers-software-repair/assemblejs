// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OutsideRootError, readApi } from "@assemblejs/cli";
import { linkedProject } from "../fixtures/linked-project.js";

const api = (source: string): ReturnType<typeof readApi> => {
  const root = mkdtempSync(join(tmpdir(), "read-api-"));
  writeFileSync(join(root, "x.api.ts"), source);
  return readApi(root, join(root, "x.api.ts"));
};

describe("an api file's route, read from its source", () => {
  it("is its path and method, GET when it names none, and whether it streams", () => {
    expect(api('export default defineApi({ path: "/about", handle: () => ({}) });')).toMatchObject({
      path: "/about",
      method: "GET",
    });
    const posted = api('export default { path: "/a/:id", method: "POST", handle: () => 1 };');
    expect(posted).toMatchObject({ path: "/a/:id", method: "POST" });
    expect(posted !== undefined && "handle" in posted).toBe(true);
    const streamed = api('export default { path: "/s", stream: () => undefined };');
    expect(streamed !== undefined && "stream" in streamed).toBe(true);
  });

  it("is nothing for a path or a method the file computes", () => {
    expect(api("const p = `/${1}`;\nexport default { path: p };")).toBeUndefined();
    expect(api('const m = "GET";\nexport default { path: "/x", method: m };')).toBeUndefined();
  });

  it("is refused, unopened, for a file that leads out of the project", () => {
    const { root } = linkedProject({}, { "src/api/prices.api.ts": "outside:secret.api.ts" });
    expect(() => readApi(root, join(root, "src/api/prices.api.ts"))).toThrow(OutsideRootError);
  });
});
