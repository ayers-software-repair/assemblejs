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

describe("building a project", () => {
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

describe("building what the command line scaffolds", () => {
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
