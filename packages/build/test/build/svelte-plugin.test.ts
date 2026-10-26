// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import { describeBuildFailure, loadSvelteCompiler, sveltePlugin } from "@asmjs/build";

const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));

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

  // The bundler said the error was in the module that imported the view: a line of generated
  // code, for a mistake on a line of the author's.
  it("reports a view the compiler refuses at the view, on the line the compiler names", async () => {
    const compile = await loadSvelteCompiler(example);
    if (compile === undefined) throw new Error("the frameworks example has no Svelte compiler");
    const root = mkdtempSync(join(tmpdir(), "svelte-plugin-"));
    writeFileSync(join(root, "broken.svelte"), "<h1>shop</h1>\n<p>{</p>\n");
    writeFileSync(
      join(root, "entry.js"),
      'import view from "./broken.svelte";\nexport default view;\n',
    );
    const failed: unknown = await build({
      entryPoints: [join(root, "entry.js")],
      absWorkingDir: root,
      bundle: true,
      write: false,
      format: "esm",
      logLevel: "silent",
      plugins: [sveltePlugin(compile, "client")],
    }).catch((error: unknown) => error);
    const said = describeBuildFailure(failed);
    expect(said).toHaveLength(1);
    expect(said[0]).toMatch(/^broken\.svelte:2 Unexpected token/);
  });

  it("reports anything else a compiler throws at the view, with no line it did not name", async () => {
    const root = mkdtempSync(join(tmpdir(), "svelte-plugin-"));
    writeFileSync(join(root, "a.svelte"), "<p>hi</p>");
    const failed: unknown = await build({
      entryPoints: [join(root, "a.svelte")],
      absWorkingDir: root,
      bundle: true,
      write: false,
      format: "esm",
      logLevel: "silent",
      plugins: [
        sveltePlugin(() => {
          throw new Error("the compiler fell over");
        }, "client"),
      ],
    }).catch((error: unknown) => error);
    expect(describeBuildFailure(failed)).toEqual(["a.svelte the compiler fell over"]);
  });
});
