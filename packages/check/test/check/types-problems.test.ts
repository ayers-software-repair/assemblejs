// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DiscoveredAssembly } from "@assemblejs/build";
import { afterAll, describe, expect, it } from "vitest";
import { typesProblems } from "@assemblejs/check";

// The package that installs React's types, which a project nested in it finds as the bundler
// would; a project in a temporary directory finds none.
const REACT = fileURLToPath(new URL("../../../renderer-react/", import.meta.url));
const made: string[] = [];
afterAll(() => {
  for (const root of made) rmSync(root, { recursive: true, force: true });
});
const project = (at: string): string => {
  const root = mkdtempSync(join(at, ".dev-types-"));
  made.push(root);
  writeFileSync(join(root, "package.json"), "{}");
  return root;
};
const found = (name: string, renderer: string): DiscoveredAssembly => ({
  name,
  directory: `src/assemblies/${name}`,
  view: `src/assemblies/${name}/${name}.${renderer}.tsx`,
  renderer,
  client: undefined,
  service: undefined,
  styles: [],
});

describe("the types a React view is checked against", () => {
  it("are named, each, when a project with a React view has not installed them", () => {
    const root = project(tmpdir());
    expect(typesProblems(root, [found("shop", "react")])).toEqual([
      {
        path: join(root, "package.json"),
        rule: "a-react-view-needs-its-types",
        message: "this project has React assemblies and @types/react is not installed",
        fix: "install @types/react as a development dependency",
      },
      {
        path: join(root, "package.json"),
        rule: "a-react-view-needs-its-types",
        message: "this project has React assemblies and @types/react-dom is not installed",
        fix: "install @types/react-dom as a development dependency",
      },
    ]);
  });

  it("are not asked of a project with no React view, Preact's and Solid's included", () => {
    const root = project(tmpdir());
    expect(typesProblems(root, [found("cart", "preact"), found("search", "solid")])).toEqual([]);
    expect(typesProblems(root, [])).toEqual([]);
  });

  it("are found where they are installed, and one of the two missing is named alone", () => {
    expect(typesProblems(project(REACT), [found("shop", "react")])).toEqual([]);
    const root = project(tmpdir());
    mkdirSync(join(root, "node_modules", "@types", "react"), { recursive: true });
    writeFileSync(join(root, "node_modules", "@types", "react", "package.json"), "{}");
    expect(typesProblems(root, [found("shop", "react")]).map((one) => one.message)).toEqual([
      "this project has React assemblies and @types/react-dom is not installed",
    ]);
  });
});
