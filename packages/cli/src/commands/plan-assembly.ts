// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectProblem } from "../discovery/project-problem.js";
import { suggestName } from "../discovery/suggest-name.js";
import { assemblyFiles } from "./assembly-files.js";
import { RENDERERS } from "./renderers.js";

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * What adding an assembly would write, or why it cannot: the files and the tag that places it,
 * or one problem with its fix. Writing is the caller's, so the command line and the agent surface
 * add an assembly through the same decision and differ only in how they report it.
 */
export function planAssembly(
  name: string,
  renderer: string,
  taken: boolean,
):
  | { readonly files: Readonly<Record<string, string>>; readonly tag: string }
  | { readonly problem: ProjectProblem; readonly usage: boolean } {
  const path = `src/assemblies/${name}`;
  if (!NAME.test(name)) {
    return {
      usage: true,
      problem: {
        path,
        rule: "directory-is-an-assembly",
        message: `"${name}" is not a usable assembly name; lower case, starting with a letter`,
        fix: `call it "${suggestName(name)}"`,
      },
    };
  }
  const files = RENDERERS.includes(renderer) ? assemblyFiles(name, renderer) : undefined;
  if (files === undefined) {
    return {
      usage: true,
      problem: {
        path,
        rule: "a-view-needs-its-renderer",
        message: `there is no renderer "${renderer}"`,
        fix: `use one of: ${RENDERERS.join(", ")}`,
      },
    };
  }
  if (taken) {
    return {
      usage: false,
      problem: {
        path,
        rule: "directory-is-an-assembly",
        message: `assembly "${name}" already exists`,
        fix: "choose another name, or edit the one that is there",
      },
    };
  }
  return { files, tag: `<assembly name="${name}"></assembly>` };
}
