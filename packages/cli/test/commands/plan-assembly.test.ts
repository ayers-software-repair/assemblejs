// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProject, realIo } from "@assemblejs/build";
import { afterAll, describe, expect, it } from "vitest";
import { planAssembly, projectFiles } from "@assemblejs/cli";
import { capture } from "../../../build/test/fixtures/capture.js";
import { serve } from "../../../build/test/fixtures/serve.js";

describe("what adding an assembly would write", () => {
  it("is its view and the tag that places it", () => {
    const plan = planAssembly("cart", "svelte", false);
    expect(plan).toEqual({
      files: { "src/assemblies/cart/cart.svelte": expect.any(String) },
      tag: '<assembly name="cart"></assembly>',
    });
  });

  it("refuses a name with the name that would work", () => {
    const plan = planAssembly("Cart Item", "html", false);
    expect(plan).toMatchObject({
      usage: true,
      problem: { rule: "directory-is-an-assembly", fix: 'call it "cart-item"' },
    });
  });

  it("refuses a renderer it cannot build, naming the ones it can", () => {
    expect(planAssembly("cart", "angular", false)).toMatchObject({
      usage: true,
      problem: {
        rule: "a-view-needs-its-renderer",
        fix: "use one of: ejs, handlebars, html, lit, markdown, nunjucks, preact, pug, react, solid, svelte, vue",
      },
    });
  });

  it("refuses an assembly that exists, which is not a usage mistake", () => {
    expect(planAssembly("cart", "html", true)).toMatchObject({
      usage: false,
      problem: { message: 'assembly "cart" already exists' },
    });
  });
});

// Nested in an example, so a scaffolded project resolves the workspace's packages as installed.
const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const scaffolded = mkdtempSync(join(example, ".dev-scaffold-"));
afterAll(() => rmSync(scaffolded, { recursive: true, force: true }));

// Each bundles a real project, longer than a unit test's default on a loaded machine.
describe("building what the command line scaffolds", { timeout: 60_000 }, () => {
  it("builds a new project with a React, a Svelte and a scripted html assembly added", async () => {
    for (const [path, contents] of Object.entries(projectFiles("scaffolded"))) {
      realIo.write(join(scaffolded, path), contents);
    }
    for (const [name, renderer] of [
      ["cart-item", "react"],
      ["counter", "svelte"],
      ["form", "html"],
    ] as const) {
      const plan = planAssembly(name, renderer, false);
      if ("problem" in plan) throw new Error(plan.problem.message);
      for (const [path, contents] of Object.entries(plan.files)) {
        realIo.write(join(scaffolded, path), contents);
      }
    }
    realIo.write(
      join(scaffolded, "src", "assemblies", "form", "form.client.ts"),
      "export default { mount: () => ({ unmount: () => undefined }) };\n",
    );
    realIo.write(join(scaffolded, "src", "assemblies", "form", "form.css"), "p { color: red; }\n");
    const counter = join(scaffolded, "src", "assemblies", "counter", "counter.svelte");
    realIo.write(counter, `${readFileSync(counter, "utf8")}\n<style>p { color: red; }</style>\n`);
    mkdirSync(join(scaffolded, "dist"), { recursive: true });
    writeFileSync(join(scaffolded, "dist", "stale.js"), "");

    const { io, errors } = capture();
    expect(await buildProject(scaffolded, io)).toBe(0);
    expect(errors).toEqual([]);
    // Each assembly's styles are built into its own stylesheet and linked from its registry entry:
    // the .css scoped to the assembly, the Svelte component's own <style> as Svelte scoped it.
    const registry = readFileSync(join(scaffolded, ".assemblejs", "assemblies.ts"), "utf8");
    const formCss = /\/_assemblejs\/assets\/styles\/(form-[0-9a-f]{8}\.css)/.exec(registry)?.[1];
    const counterCss = /\/_assemblejs\/assets\/styles\/(counter-[0-9a-f]{8}\.css)/.exec(
      registry,
    )?.[1];
    expect(
      readFileSync(join(scaffolded, "dist", "client", "styles", String(formCss)), "utf8"),
    ).toContain('assembly-root[data-name="form"] p');
    expect(
      readFileSync(join(scaffolded, "dist", "client", "styles", String(counterCss)), "utf8"),
    ).toMatch(/p\.svelte-[a-z0-9]+/);
    // Nothing a previous build wrote outlives it.
    expect(existsSync(join(scaffolded, "dist", "stale.js"))).toBe(false);
    // The scripted html assembly has a browser half like the framework ones.
    expect(existsSync(join(scaffolded, ".assemblejs", "client", "form.ts"))).toBe(true);
    expect(readFileSync(join(scaffolded, ".assemblejs", "assemblies.ts"), "utf8")).toMatch(
      /name: "form".*assets: \{ css: \["[^"]+"\], js: \["/,
    );
  });
});

// Nested in the example that installs every framework, as the one above is in its own.
const frameworks = fileURLToPath(new URL("../../../../examples/frameworks/", import.meta.url));
const everyFramework = mkdtempSync(join(frameworks, ".dev-scaffold-"));
afterAll(() => rmSync(everyFramework, { recursive: true, force: true }));

describe("building what the command line scaffolds, in Solid and Lit", { timeout: 60_000 }, () => {
  it("builds each through its own renderer, and serves the markup each hydrates", async () => {
    for (const [path, contents] of Object.entries(projectFiles("every-framework"))) {
      realIo.write(join(everyFramework, path), contents);
    }
    for (const [name, renderer] of [
      ["ticker", "solid"],
      ["badge", "lit"],
    ] as const) {
      const plan = planAssembly(name, renderer, false);
      if ("problem" in plan) throw new Error(plan.problem.message);
      for (const [path, contents] of Object.entries(plan.files)) {
        realIo.write(join(everyFramework, path), contents);
      }
    }
    const { io, errors } = capture();
    expect(await buildProject(everyFramework, io)).toBe(0);
    expect(errors).toEqual([]);
    // Solid's own compiler wrote the hydration keys; Lit's server half wrote its part markers.
    expect(await serve(everyFramework, "/assembly/ticker/")).toMatch(/data-hk="[0-9a-f-]+"/);
    expect(await serve(everyFramework, "/assembly/badge/")).toContain("<!--lit-part");
    // Lit's hydration support is installed before anything else in the browser entry.
    const entry = readFileSync(join(everyFramework, ".assemblejs", "client.ts"), "utf8");
    expect(entry).toMatch(/^import "@assemblejs\/renderer-lit\/hydration-support";$/m);
    expect(entry.indexOf("hydration-support")).toBeLessThan(entry.indexOf("badge"));
  });
});
