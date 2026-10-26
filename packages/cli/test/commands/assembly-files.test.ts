// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProject, realIo } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import { assemblyFiles, planAssembly, projectFiles } from "@asmjs/cli";
import { builtScripts } from "../../../build/test/fixtures/built-scripts.js";
import { capture } from "../../../build/test/fixtures/capture.js";
import { serve } from "../../../build/test/fixtures/serve.js";

describe("what a new assembly is made of", () => {
  it("names the view file so its framework is visible from a directory listing", () => {
    expect(Object.keys(assemblyFiles("cart", "svelte") ?? {})).toEqual([
      "src/assemblies/cart/cart.svelte",
    ]);
    expect(Object.keys(assemblyFiles("cart", "preact") ?? {})).toEqual([
      "src/assemblies/cart/cart.preact.tsx",
    ]);
    expect(Object.keys(assemblyFiles("cart", "react") ?? {})).toEqual([
      "src/assemblies/cart/cart.react.tsx",
    ]);
  });

  it("writes each view in its own framework's idiom", () => {
    const svelte = Object.values(assemblyFiles("cart-item", "svelte") ?? {})[0] ?? "";
    expect(svelte).toContain("$props()");
    expect(svelte).not.toContain("export default function");
    // Its props are typed by the renderer's own type, as every other view the scaffold writes:
    // untyped, a new view read its data and its events as `any`.
    expect(svelte).toContain('import type { AssemblyProps } from "@asmjs/renderer-svelte";');
    expect(svelte).toContain("let { data }: AssemblyProps = $props();");
    const react = Object.values(assemblyFiles("cart-item", "react") ?? {})[0] ?? "";
    // A React component's name starts with a capital, or React treats it as an html tag.
    expect(react).toContain("export default function CartItem(");
  });

  it("is one view and nothing to register anywhere", () => {
    expect(Object.keys(assemblyFiles("cart", "html") ?? {})).toEqual([
      "src/assemblies/cart/cart.html",
    ]);
  });

  it("names a template view by its language's own extension, its markup escaping data", () => {
    const files = {
      ejs: "cart.ejs",
      handlebars: "cart.hbs",
      markdown: "cart.md",
      nunjucks: "cart.njk",
      pug: "cart.pug",
    };
    for (const [renderer, file] of Object.entries(files)) {
      expect(Object.keys(assemblyFiles("cart", renderer) ?? {})).toEqual([
        `src/assemblies/cart/${file}`,
      ]);
    }
    expect(Object.values(assemblyFiles("cart", "ejs") ?? {})[0]).toContain("<%= data.title");
  });

  it("is nothing at all for a renderer it does not know", () => {
    expect(assemblyFiles("cart", "angular")).toBeUndefined();
    expect(assemblyFiles("cart", "constructor")).toBeUndefined();
  });
});

// Nested in the example that installs the templates package.
const templates = fileURLToPath(new URL("../../../../examples/templates/", import.meta.url));

describe("building what the command line scaffolds, in each template language", () => {
  it.each([
    ["ejs", "<p>notice</p>"],
    ["handlebars", "<p>notice</p>"],
    ["markdown", "<h1>notice</h1>"],
    ["nunjucks", "<p>notice</p>"],
    ["pug", "<p>notice</p>"],
  ])(
    "generates, builds and runs a project with a %s assembly",
    { timeout: 60_000 },
    async (renderer, markup) => {
      const root = mkdtempSync(join(templates, ".dev-scaffold-"));
      try {
        for (const [path, contents] of Object.entries(projectFiles(renderer))) {
          realIo.write(join(root, path), contents);
        }
        const plan = planAssembly("notice", renderer, false);
        if ("problem" in plan) throw new Error(plan.problem.message);
        for (const [path, contents] of Object.entries(plan.files)) {
          realIo.write(join(root, path), contents);
        }
        const home = join(root, "src", "pages", "home", "home.html");
        writeFileSync(home, readFileSync(home, "utf8").replace("</body>", `${plan.tag}\n</body>`));
        const { io, errors } = capture();
        expect(await buildProject(root, io)).toBe(0);
        expect(errors).toEqual([]);
        const page = await serve(root, "/");
        expect(page).toMatch(
          new RegExp(
            `<assembly-root data-name="notice"[^>]*data-renderer="${renderer}"[^>]*>${markup}`,
          ),
        );
        // Server markup and nothing more: no browser half, so no script on the page and none
        // built, which would serve the template's source as a public asset.
        expect(page).not.toContain('<script type="module"');
        expect(builtScripts(root)).toEqual([]);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );
});
