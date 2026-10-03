// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import { sveltePlugin } from "@assemblejs/cli";

describe("compiling a .svelte file inside the bundler", () => {
  it("hands the file and the side being built to the compiler", async () => {
    const root = mkdtempSync(join(tmpdir(), "svelte-plugin-"));
    writeFileSync(join(root, "a.svelte"), "<p>hi</p>");
    const seen: string[] = [];
    const result = await build({
      entryPoints: [join(root, "a.svelte")],
      bundle: true,
      write: false,
      format: "esm",
      plugins: [
        sveltePlugin((source, options) => {
          seen.push(`${options.generate}:${source}`);
          return { js: { code: "export default 42;" } };
        }, "client"),
      ],
    });
    expect(seen).toEqual(["client:<p>hi</p>"]);
    expect(result.outputFiles[0]?.text).toContain("42");
  });

  it("hands a component's own styles on, by file", async () => {
    const root = mkdtempSync(join(tmpdir(), "svelte-plugin-"));
    writeFileSync(join(root, "a.svelte"), "<p>hi</p>");
    const styles: string[] = [];
    await build({
      entryPoints: [join(root, "a.svelte")],
      bundle: true,
      write: false,
      format: "esm",
      plugins: [
        sveltePlugin(
          () => ({ js: { code: "export default 1;" }, css: { code: "p.svelte-x{}" } }),
          "client",
          (file, css) => styles.push(`${file.endsWith("a.svelte") ? "a" : "?"}:${css}`),
        ),
      ],
    });
    expect(styles).toEqual(["a:p.svelte-x{}"]);
  });
});
