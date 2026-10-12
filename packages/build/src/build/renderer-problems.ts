// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { join } from "node:path";
import { aRenderer } from "../discovery/a-renderer.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { findPackage } from "./find-package.js";
import { RENDERER_PACKAGES } from "./renderer-packages.js";

/**
 * What stops one assembly's view being built for want of its renderer: a renderer this version
 * cannot build; its package, where the project has not installed it; and the framework itself,
 * where the build compiles a view with the project's own compiler and the project has none.
 * Plain html needs nothing.
 *
 * One reading, asked by the build of every assembly a project has and by `add assembly` of the
 * one it has just written, so adding a view says at once what `check` would say of it.
 */
export function rendererProblems(
  root: string,
  name: string,
  renderer: string,
  view: string,
): readonly ProjectProblem[] {
  if (renderer === "html") return [];
  const known = Object.hasOwn(RENDERER_PACKAGES, renderer)
    ? RENDERER_PACKAGES[renderer]
    : undefined;
  if (known === undefined) {
    return [
      {
        path: view,
        rule: "a-view-needs-its-renderer",
        message: `"${name}" is ${aRenderer(renderer)} assembly, which this version cannot build yet`,
        fix: `write it for one of: html, ${Object.keys(RENDERER_PACKAGES).join(", ")}`,
      },
    ];
  }
  const problems: ProjectProblem[] = [];
  if (known.compiler !== undefined && findPackage(root, known.compiler) === undefined) {
    const framework = `${known.name.slice(0, 1).toUpperCase()}${known.name.slice(1)}`;
    problems.push({
      path: join(root, "package.json"),
      rule: "a-view-needs-its-renderer",
      message: `this project has ${framework} assemblies and ${known.compiler} is not installed`,
      fix: `install ${known.compiler}`,
    });
  }
  if (findPackage(root, known.package) === undefined) {
    problems.push({
      path: view,
      rule: "a-view-needs-its-renderer",
      message: `"${name}" is ${aRenderer(known.name)} assembly and ${known.package} is not installed`,
      fix: `install ${known.package}`,
    });
  }
  return problems;
}
