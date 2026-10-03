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

  // Solid's compiler reads JavaScript, not decorators, so the type strip ahead of it lowers them.
  it("compiles a Solid view whose file uses decorators", async () => {
    const example = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
    const solid = await loadSolidCompiler(example);
    const root = mkdtempSync(join(tmpdir(), "solid-decorated-"));
    writeFileSync(
      join(root, "d.solid.tsx"),
      "const named = (value: unknown, _context: ClassDecoratorContext) => value;\n" +
        "@named class Store { total = 1; }\n" +
        "export default () => <p>{new Store().total}</p>;",
    );
    const result = await build({
      entryPoints: [join(root, "d.solid.tsx")],
      bundle: true,
      write: false,
      format: "esm",
      external: ["solid-js", "solid-js/web"],
      plugins: [jsxPlugin([], "client", solid)],
    });
    expect(result.outputFiles[0]?.text).toContain("getNextElement");
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

  const project = () => {
    const root = mkdtempSync(join(tmpdir(), "jsx-shared-"));
    for (const name of ["a", "b", "shared"]) mkdirSync(join(root, name));
    writeFileSync(join(root, "shared", "badge.tsx"), "export const Badge = () => <i>badge</i>;");
    writeFileSync(
      join(root, "a", "a.preact.tsx"),
      'import { Badge } from "../shared/badge.js";\nexport default () => <p><Badge /></p>;',
    );
    writeFileSync(
      join(root, "b", "b.react.tsx"),
      'import { Badge } from "../shared/badge.js";\nexport default () => <p><Badge /></p>;',
    );
    const assembly = (name: string, renderer: string): DiscoveredAssembly => ({
      name,
      directory: join(root, name),
      view: join(root, name, `${name}.${renderer}.tsx`),
      renderer,
      client: undefined,
      service: undefined,
      styles: [],
    });
    return { root, assemblies: [assembly("a", "preact"), assembly("b", "react")] };
  };
  const bundle = (entries: string[], assemblies: DiscoveredAssembly[]) =>
    build({
      entryPoints: entries,
      bundle: true,
      jsx: "automatic",
      write: false,
      logLevel: "silent",
      format: "esm",
      outdir: "/out",
      external: ["react", "preact"],
      plugins: [jsxPlugin(assemblies, "client")],
    });

  it("compiles a shared component as the framework of the assembly that imports it", async () => {
    const { root, assemblies } = project();
    const out =
      (await bundle([join(root, "a", "a.preact.tsx")], assemblies)).outputFiles[0]?.text ?? "";
    expect(out).toContain('from "preact/jsx-runtime"');
    expect(out).not.toContain('from "react/jsx-runtime"');
  });

  it("refuses a shared component imported from two frameworks, naming both", async () => {
    const { root, assemblies } = project();
    await expect(
      bundle([join(root, "a", "a.preact.tsx"), join(root, "b", "b.react.tsx")], assemblies),
    ).rejects.toThrow(/badge\.tsx is imported by preact and react assemblies/);
  });

  it("keeps every line of a file at its own number in a diagnostic", async () => {
    const root = mkdtempSync(join(tmpdir(), "jsx-lines-"));
    writeFileSync(join(root, "bad.react.tsx"), "export const a = 1;\nexport const = ;");
    await expect(bundle([join(root, "bad.react.tsx")], [])).rejects.toThrow(/bad\.react\.tsx:2:/);
  });
});
