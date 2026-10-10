// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadPug } from "@assemblejs/cli";

// The example that installs the templates package, as a project that did; the loader only walks
// upward from the root it is given, so the example's own root serves and nothing is written.
const templates = fileURLToPath(new URL("../../../../examples/templates/", import.meta.url));

describe("the project's own Pug", () => {
  it("is the one its templates renderer installed, which compiles a template", () => {
    const pug = loadPug(templates);
    expect(pug).toBeDefined();
    const render = pug?.compile("p= data.n", { plugins: [] }) as (locals: object) => string;
    expect(render({ data: { n: 1 } })).toBe("<p>1</p>");
  });

  it("is undefined where the project has no templates renderer installed", () => {
    expect(loadPug(mkdtempSync(join(tmpdir(), "no-pug-")))).toBeUndefined();
  });

  // A package manager that links keeps each package in a store, its dependencies beside it
  // there, and gives the project a link: Pug is beside where the package really is.
  it("is found beside where the templates renderer really is, behind the project's link to it", () => {
    const root = mkdtempSync(join(tmpdir(), "linked-pug-"));
    const store = join(root, "node_modules", ".store", "renderer-templates", "node_modules");
    mkdirSync(join(store, "@assemblejs", "renderer-templates"), { recursive: true });
    writeFileSync(join(store, "@assemblejs", "renderer-templates", "package.json"), "{}");
    mkdirSync(join(store, "pug"));
    writeFileSync(join(store, "pug", "package.json"), '{ "main": "main.js" }');
    writeFileSync(join(store, "pug", "main.js"), 'exports.compile = () => "the store\'s";\n');
    mkdirSync(join(root, "node_modules", "@assemblejs"));
    symlinkSync(
      join(store, "@assemblejs", "renderer-templates"),
      join(root, "node_modules", "@assemblejs", "renderer-templates"),
    );
    expect(loadPug(root)?.compile("p", { plugins: [] })).toBe("the store's");
  });

  it("is undefined where the templates renderer is there and no Pug is, or none that compiles", () => {
    const root = mkdtempSync(join(tmpdir(), "hollow-pug-"));
    const hollow = join(root, "node_modules", "@assemblejs", "renderer-templates");
    mkdirSync(hollow, { recursive: true });
    writeFileSync(join(hollow, "package.json"), "{}");
    // Under a test runner a package manager started, node would find the workspace's Pug by
    // NODE_PATH: this is undefined only because node is never asked.
    expect(loadPug(root)).toBeUndefined();
    // Each in a project of its own: node keeps what it has loaded from a file.
    for (const main of ["module.exports = {};", 'throw new Error("broken");']) {
      const own = mkdtempSync(join(tmpdir(), "broken-pug-"));
      const modules = join(own, "node_modules");
      mkdirSync(join(modules, "@assemblejs", "renderer-templates"), { recursive: true });
      writeFileSync(join(modules, "@assemblejs", "renderer-templates", "package.json"), "{}");
      mkdirSync(join(modules, "pug"));
      writeFileSync(join(modules, "pug", "package.json"), '{ "main": "main.js" }');
      writeFileSync(join(modules, "pug", "main.js"), main);
      expect(loadPug(own), main).toBeUndefined();
    }
  });
});
