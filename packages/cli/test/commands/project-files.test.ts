// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildProject, realIo } from "@assemblejs/build";
import { MCP_REGISTRATIONS, agentFiles, runCheck, runPerf } from "@assemblejs/check";
import { describe, expect, it } from "vitest";
import { projectFiles } from "@assemblejs/cli";
import { capture } from "../../../build/test/fixtures/capture.js";
import { serve } from "../../../build/test/fixtures/serve.js";

describe("the smallest project that runs", () => {
  const files = projectFiles("my-app");

  it("depends on the version of the command line that wrote it, never a number typed twice", () => {
    const own = (
      JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
        version: string;
      }
    ).version;
    const manifest = JSON.parse(files["package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(manifest.dependencies["@assemblejs/core"]).toBe(`^${own}`);
    expect(manifest.devDependencies).toEqual({
      "@assemblejs/cli": `^${own}`,
      "@assemblejs/mcp": `^${own}`,
    });
  });

  // An agent that opens the project is told what it is, and has its agent surface to ask:
  // installed with the command line, and registered where each client looks for it.
  it("is written for the agents that will work in it", () => {
    const forAgents = agentFiles("my-app").files;
    expect(Object.keys(forAgents)).toHaveLength(7);
    for (const [path, contents] of Object.entries(forAgents)) {
      expect(files[path], path).toBe(contents);
    }
    for (const registration of MCP_REGISTRATIONS) {
      expect(files["README.md"], registration.path).toContain(`\`${registration.path}\``);
    }
    expect(files["README.md"]).toContain("`npx assemblejs add agents`");
  });

  it("has a server file that does not grow when an assembly is added", () => {
    const server = files["src/server.ts"] ?? "";
    // No imports per assembly, no arrays to append to: the generated module is the registry.
    expect(server).toContain('from "../.assemblejs/project.js"');
    expect(server).not.toContain("src/assemblies/");
    expect(server.split("\n").filter((line) => line.startsWith("import"))).toHaveLength(2);
  });

  it("ships one page placing one assembly, and no framework the author did not ask for", () => {
    expect(Object.keys(files)).toContain("src/assemblies/hello/hello.html");
    expect(files["src/pages/home/home.html"]).toContain('<assembly name="hello"></assembly>');
    const manifest = JSON.parse(files["package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
    };
    expect(Object.keys(manifest.dependencies)).toEqual(["@assemblejs/core"]);
  });

  it("starts with the project's tokens, the one place its look is set, and the components styled by them", () => {
    expect(files["src/tokens.css"]).toContain("--ink:");
    expect(files["src/tokens.css"]).toContain("@media (prefers-color-scheme: dark)");
    expect(files["src/components.css"]).toContain(".notice {");
    // The starter's one assembly uses them: a notice, and a link styled as the button.
    expect(files["src/assemblies/hello/hello.html"]).toContain('<section class="notice">');
    expect(files["src/assemblies/hello/hello.html"]).toContain('<a class="button" href=');
  });

  it("ignores the generated module rather than committing it", () => {
    expect(files[".gitignore"]).toContain(".assemblejs/");
  });
});

// Nested in an example, so the project resolves the workspace's packages as installed.
const example = fileURLToPath(new URL("../../../../examples/two-frameworks/", import.meta.url));

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

describe("what the checks make of a new project", { timeout: 60_000 }, () => {
  // B-20's proof, its first half: a generated project passes check.
  it("passes check as it is written, and check says so", async () => {
    const root = mkdtempSync(join(tmpdir(), "new-checked-"));
    try {
      for (const [path, contents] of Object.entries(projectFiles("checked"))) {
        realIo.write(join(root, path), contents);
      }
      const { io, logs, errors } = capture();
      expect(await runCheck(root, io)).toBe(0);
      expect(errors).toEqual([]);
      expect(logs).toEqual(["no problems"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("is built, run in production and weighed by perf, page by page", async () => {
    const root = mkdtempSync(join(example, ".dev-perf-"));
    try {
      for (const [path, contents] of Object.entries(projectFiles("weighed"))) {
        realIo.write(join(root, path), contents);
      }
      realIo.write(join(root, "src", "assemblies", "hello", "hello.css"), ".hi { color: red }\n");
      // A page at the route its own file declares, not the one its directory implies.
      realIo.write(
        join(root, "src", "pages", "shop", "shop.html"),
        '<body><assembly name="hello"></assembly></body>',
      );
      realIo.write(
        join(root, "src", "pages", "shop", "shop.page.ts"),
        'import { definePage } from "@assemblejs/core";\nexport default definePage({ route: "/store" });\n',
      );
      const { io, logs, errors } = capture();
      expect(await runPerf(root, io)).toBe(0);
      expect(errors).toEqual([]);
      const line = logs.find((entry) => entry.startsWith("/  document"));
      expect(logs.some((entry) => entry.startsWith("/store  document"))).toBe(true);
      expect(line).toMatch(
        // The styles weigh the tokens every page links and the assembly's own sheet.
        /^\/ {2}document \d+ B \(\d+ B gzip\) {2}styles (?:[1-9]\d* B|\d+(?:\.\d+)? kB) \((?:\d+ B|\d+(?:\.\d+)? kB) gzip\) {2}scripts 0 B \(0 B gzip\)$/,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
