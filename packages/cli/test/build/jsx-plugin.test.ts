// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";
import { jsxPlugin, loadSolidCompiler } from "@assemblejs/cli";
import type { DiscoveredAssembly } from "@assemblejs/cli";

describe("compiling each JSX file through its own framework's runtime", () => {
  it("builds a React and a Preact view side by side, each against its own runtime", async () => {
    const root = mkdtempSync(join(tmpdir(), "jsx-"));
    for (const name of ["a", "b"]) mkdirSync(join(root, name));
    writeFileSync(join(root, "a", "a.react.tsx"), "export default () => <p>react</p>;");
    writeFileSync(join(root, "b", "b.preact.tsx"), "export default () => <p>preact</p>;");
    writeFileSync(join(root, "entry.ts"), 'import "./a/a.react.tsx";\nimport "./b/b.preact.tsx";');
    const result = await build({
      entryPoints: [join(root, "entry.ts")],
      bundle: true,
      write: false,
      jsx: "automatic",
      format: "esm",
      external: ["react", "preact"],
      plugins: [jsxPlugin([], "client")],
    });
    const out = result.outputFiles[0]?.text ?? "";
    expect(out).toContain('from "react/jsx-runtime"');
    expect(out).toContain('from "preact/jsx-runtime"');
  });

  it("compiles a Solid view, and its own components, with Solid's compiler for each side", async () => {
    const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
    const solid = await loadSolidCompiler(example);
    const root = mkdtempSync(join(tmpdir(), "solid-jsx-"));
    mkdirSync(join(root, "c"));
    writeFileSync(
      join(root, "c", "c.solid.tsx"),
      'import { Row } from "./row.js";\nexport default (props: { n: number }) => <ul><Row n={props.n} /></ul>;',
    );
    writeFileSync(
      join(root, "c", "row.tsx"),
      "export const Row = (props: { n: number }) => <li>{props.n}</li>;",
    );
    const assemblies: DiscoveredAssembly[] = [
      {
        name: "c",
        directory: join(root, "c"),
        view: join(root, "c", "c.solid.tsx"),
        renderer: "solid",
        client: undefined,
        service: undefined,
        styles: [],
      },
    ];
    const bundle = async (side: "client" | "server") =>
      (
        await build({
          entryPoints: [join(root, "c", "c.solid.tsx")],
          bundle: true,
          write: false,
          format: "esm",
          external: ["solid-js", "solid-js/web"],
          plugins: [jsxPlugin(assemblies, side, solid)],
        })
      ).outputFiles[0]?.text ?? "";
    const server = await bundle("server");
    const client = await bundle("client");
    expect(server).toContain("ssrHydrationKey");
    expect(client).toContain("getNextElement");
    expect(client).not.toContain("jsx-runtime");
  });

  it("refuses a Solid view when the project has no Solid compiler", async () => {
    const root = mkdtempSync(join(tmpdir(), "solid-none-"));
    writeFileSync(join(root, "v.solid.tsx"), "export default () => <p />;");
    await expect(
      build({
        entryPoints: [join(root, "v.solid.tsx")],
        bundle: true,
        write: false,
        logLevel: "silent",
        plugins: [jsxPlugin([], "client")],
      }),
    ).rejects.toThrow(/renderer-solid is not installed/);
  });
});
