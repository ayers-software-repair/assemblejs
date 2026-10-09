// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadVueCompiler } from "@assemblejs/cli";

describe("loading the project's own Vue compiler", () => {
  it("finds it in a project with Vue installed", async () => {
    const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
    expect(typeof (await loadVueCompiler(example))?.compileScript).toBe("function");
  });

  it("is undefined in a project without Vue", async () => {
    const root = mkdtempSync(join(tmpdir(), "no-vue-"));
    writeFileSync(join(root, "package.json"), "{}");
    expect(await loadVueCompiler(root)).toBeUndefined();
  });
});
