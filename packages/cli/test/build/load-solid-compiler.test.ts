// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadSolidCompiler } from "@assemblejs/cli";

describe("loading the compiler the project's Solid renderer carries", () => {
  it("finds it in a project with the renderer installed, and it compiles", async () => {
    const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
    const compile = await loadSolidCompiler(example);
    expect(
      compile?.("export default () => <p>a</p>;", { filename: "/p/a.jsx", side: "server" }),
    ).toContain("ssrHydrationKey");
  });

  it("is undefined when the installed renderer carries no compiler", async () => {
    const root = mkdtempSync(join(tmpdir(), "broken-solid-"));
    const renderer = join(root, "node_modules", "@assemblejs", "renderer-solid");
    mkdirSync(renderer, { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(
      join(renderer, "package.json"),
      JSON.stringify({
        name: "@assemblejs/renderer-solid",
        type: "module",
        exports: { "./compiler": "./compiler.js" },
      }),
    );
    writeFileSync(join(renderer, "compiler.js"), 'export const compileSolid = "not a compiler";\n');
    expect(await loadSolidCompiler(root)).toBeUndefined();
  });

  it("is undefined in a project without the renderer", async () => {
    const root = mkdtempSync(join(tmpdir(), "no-solid-"));
    writeFileSync(join(root, "package.json"), "{}");
    expect(await loadSolidCompiler(root)).toBeUndefined();
  });
});
