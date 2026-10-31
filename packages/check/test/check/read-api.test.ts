// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OutsideRootError } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { readApi } from "@asmjs/check";
import { linkedProject } from "../../../build/test/fixtures/linked-project.js";

const api = async (source: string): Promise<ReturnType<typeof readApi>> => {
  const root = mkdtempSync(join(tmpdir(), "read-api-"));
  writeFileSync(join(root, "x.api.ts"), source);
  return await readApi(root, join(root, "x.api.ts"));
};

describe("an api file's route, read from its source", () => {
  it("is its path and method, GET when it names none, and whether it streams", async () => {
    expect(
      await api('export default defineApi({ path: "/about", handle: () => ({}) });'),
    ).toMatchObject({
      path: "/about",
      method: "GET",
    });
    const posted = await api('export default { path: "/a/:id", method: "POST", handle: () => 1 };');
    expect(posted).toMatchObject({ path: "/a/:id", method: "POST" });
    expect(posted !== undefined && "handle" in posted).toBe(true);
    const streamed = await api('export default { path: "/s", stream: () => undefined };');
    expect(streamed !== undefined && "stream" in streamed).toBe(true);
  });

  it("is nothing for a path or a method the file computes", async () => {
    expect(await api("const p = `/${1}`;\nexport default { path: p };")).toBeUndefined();
    expect(
      await api('const m = "GET";\nexport default { path: "/x", method: m };'),
    ).toBeUndefined();
  });

  it("is refused, unopened, for a file that leads out of the project", async () => {
    const { root } = linkedProject({}, { "src/api/prices.api.ts": "outside:secret.api.ts" });
    await expect(readApi(root, join(root, "src/api/prices.api.ts"))).rejects.toThrow(
      OutsideRootError,
    );
  });
});
