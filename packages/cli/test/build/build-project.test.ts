// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { afterAll } from "vitest";
import { buildProject, planAssembly, projectFiles, realIo } from "@assemblejs/cli";
import type { Io } from "@assemblejs/cli";

const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));
const capture = () => {
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = { ...realIo, log: (line) => logs.push(line), error: (line) => errors.push(line) };
  return { io, logs, errors };
};

/** Starts a built server under plain node and answers what it serves at a path. */
const serve = async (root: string, path: string): Promise<string> => {
  const port = String(20000 + Math.floor(Math.random() * 20000));
  const child = spawn(process.execPath, ["dist/server.js"], {
    cwd: root,
    env: { ...process.env, ASSEMBLEJS_PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    const origin = await new Promise<string>((resolve, reject) => {
      child.stdout.on("data", (chunk: Buffer) => {
        const found = /listening (http:\/\/\S+)/.exec(String(chunk));
        if (found?.[1] !== undefined) resolve(found[1]);
      });
      child.on("exit", (code) => reject(new Error(`exited with ${String(code)}`)));
    });
    return await (await fetch(`${origin}${path}`)).text();
  } finally {
    child.kill();
  }
};

// Each of these bundles a real project and starts the server it built, which on a loaded machine
// takes longer than a unit test's default allows.
describe("building a project", { timeout: 60_000 }, () => {
  it("writes a server that plain node starts, composing the page from both frameworks", async () => {
    const { io, logs } = capture();
    expect(await buildProject(example, io)).toBe(0);
    expect(logs.join()).toContain("built 3 assembly(s), 1 page(s), 1 api(s)");
    expect(readFileSync(join(example, ".assemblejs", "project.ts"), "utf8")).toMatch(
      /version: "[0-9a-f]{12}"/,
    );
    const page = await serve(example, "/");
    expect(page).toContain('data-renderer="svelte"');
    expect(page).toContain("Clicked 0");
    expect(page).toContain('<p id="readout">nothing yet</p>');
    expect(page).toMatch(
      /<script type="module" src="\/_assemblejs\/assets\/client-[A-Z0-9]+\.js">/,
    );
    expect(JSON.parse(await serve(example, "/api/time"))).toHaveProperty("now");
  });

  it("refuses, before bundling, a project it cannot build, saying every reason", async () => {
    const root = mkdtempSync(join(tmpdir(), "broken-"));
    mkdirSync(join(root, "src", "assemblies", "a"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(join(root, "src", "assemblies", "a", "a.angular.tsx"), "");
    const { io, errors } = capture();
    expect(await buildProject(root, io)).toBe(1);
    expect(errors.join()).toMatch(/cannot build yet/);
    expect(errors.join()).toMatch(/no src\/server\.ts/);
    expect(existsSync(join(root, "dist"))).toBe(false);
  });

  it("reports a source the bundler cannot read, with its file and line", async () => {
    const root = mkdtempSync(join(tmpdir(), "syntax-"));
    mkdirSync(join(root, "src"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(join(root, "src", "server.ts"), "export const = ;");
    const { io, errors } = capture();
    expect(await buildProject(root, io)).toBe(1);
    expect(errors.join()).toMatch(/server\.ts:1/);
  });

  it("refuses a Svelte assembly when Svelte is not installed", async () => {
    const root = mkdtempSync(join(tmpdir(), "no-svelte-"));
    mkdirSync(join(root, "src", "assemblies", "a"), { recursive: true });
    writeFileSync(join(root, "package.json"), "{}");
    writeFileSync(join(root, "src", "assemblies", "a", "a.svelte"), "<p>a</p>");
    const { io, errors } = capture();
    expect(await buildProject(root, io)).toBe(1);
    expect(errors.join()).toMatch(/svelte is not installed: install svelte/);
  });
});

// Nested in the example, so a scaffolded project resolves the workspace's packages as an
// installed one would.
const scaffolded = mkdtempSync(join(example, ".dev-scaffold-"));
afterAll(() => rmSync(scaffolded, { recursive: true, force: true }));

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
        // Server markup and nothing more: no browser half, so no script on the page.
        expect(page).not.toContain('<script type="module"');
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );
});

describe("building a project with styles and no browser script", { timeout: 60_000 }, () => {
  it("serves its stylesheets all the same", async () => {
    const root = mkdtempSync(join(example, ".dev-styles-"));
    try {
      for (const [path, contents] of Object.entries(projectFiles("plain"))) {
        realIo.write(join(root, path), contents);
      }
      writeFileSync(join(root, "src", "assemblies", "hello", "hello.css"), ".hi { color: red }");
      expect(await buildProject(root, capture().io)).toBe(0);
      const page = await serve(root, "/");
      expect(page).not.toContain('<script type="module"');
      const href = /href="(\/_assemblejs\/assets\/styles\/hello-[0-9a-f]{8}\.css)"/.exec(page)?.[1];
      expect(await serve(root, String(href))).toContain('assembly-root[data-name="hello"] .hi');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
