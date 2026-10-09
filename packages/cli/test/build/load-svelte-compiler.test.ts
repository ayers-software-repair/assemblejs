// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSvelteCompiler } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));

describe("loading the project's own Svelte compiler", () => {
  it("loads the compiler the project installed, and it compiles", async () => {
    const compile = await loadSvelteCompiler(example);
    expect(compile).toBeTypeOf("function");
    const out = compile?.("<p>hi</p>", { filename: "a.svelte", generate: "server" });
    expect(out?.js.code).toContain("hi");
  });

  it("is undefined for a project with no Svelte installed", async () => {
    const root = mkdtempSync(join(tmpdir(), "no-svelte-"));
    writeFileSync(join(root, "package.json"), "{}");
    expect(await loadSvelteCompiler(root)).toBeUndefined();
  });
});
