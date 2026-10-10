// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from "node:fs";
import { SEGMENT } from "@assemblejs/core";
import { leadsOut } from "../root/leads-out.js";
import { outsideProblems } from "../root/outside-problems.js";
import type { DiscoveredAssembly } from "./discovered-assembly.js";
import { isDirectory } from "./is-directory.js";
import { pickView } from "./pick-view.js";
import type { ProjectProblem } from "./project-problem.js";
import { rendererForView } from "./renderer-for-view.js";
import { suggestName } from "./suggest-name.js";

/**
 * Every assembly of a project: each directory under its `src/assemblies`. A directory IS an
 * assembly; there is nothing to register.
 *
 * The alternative was a hand-maintained list restating the directory tree, which is the largest
 * single piece of ceremony an author would otherwise carry, and the thing two people editing
 * different assemblies would always conflict in.
 *
 * A directory that cannot be an assembly is reported rather than skipped. Skipping is how an
 * author renames a file, loses their assembly, and finds out from a visitor.
 *
 * Nothing outside the project is looked at. A directory that leads out of the root is reported
 * and not listed; a file inside an assembly that leads out is reported and kept by its name,
 * for a reader to refuse.
 */
export function discoverAssemblies(root: string): {
  readonly assemblies: readonly DiscoveredAssembly[];
  readonly problems: readonly ProjectProblem[];
} {
  const assemblies: DiscoveredAssembly[] = [];
  const problems: ProjectProblem[] = [];
  const within = `${root}/src/assemblies`.replaceAll("\\", "/");
  if (leadsOut(root, within)) return { assemblies, problems: outsideProblems(root, [within]) };

  let entries: string[];
  try {
    entries = readdirSync(within).sort();
  } catch {
    // No assemblies directory at all is an empty project, not a broken one.
    return { assemblies, problems };
  }

  for (const name of entries) {
    const at = `${within}/${name}`;
    // Asked before the entry is so much as looked at: one that leads out is not a directory
    // of this project's, whatever stands where it leads.
    if (leadsOut(root, at)) {
      problems.push(...outsideProblems(root, [at]));
      continue;
    }
    if (!isDirectory(at)) continue;
    if (!SEGMENT.test(name)) {
      problems.push({
        path: at,
        rule: "directory-is-an-assembly",
        message: `"${name}" is not a usable assembly name; names are lower case, start with a letter, and use hyphens`,
        fix: `rename the directory to "${suggestName(name)}"`,
      });
      continue;
    }

    const files = readdirSync(at).sort();
    const views = files.filter(
      (file) => rendererForView(file) !== undefined && !file.endsWith(".client.ts"),
    );
    if (views.length === 0) {
      const unnamed = files.find((file) => /\.(tsx|jsx)$/.test(file));
      problems.push(
        unnamed === undefined
          ? {
              path: at,
              rule: "directory-is-an-assembly",
              message: `"${name}" has no view file, so nothing can render it`,
              fix: `add ${name}.html, or a framework view such as ${name}.react.tsx or ${name}.svelte`,
            }
          : {
              path: `${at}/${unnamed}`,
              rule: "the-file-name-says-the-framework",
              message: `"${unnamed}" does not say which framework wrote it`,
              fix: `name the framework: ${unnamed.replace(/\.(tsx|jsx)$/, ".react.$1")}, or .preact or .solid`,
            },
      );
      continue;
    }
    const view = pickView(name, views);
    if (view === undefined) {
      problems.push({
        path: at,
        rule: "one-framework-per-assembly",
        message: `"${name}" has more than one view file: ${views.join(", ")}`,
        fix: `name the view after the assembly and write its components in the same framework; a second framework is a second assembly`,
      });
      continue;
    }

    const client = files.find((file) => file.endsWith(".client.ts"));
    const service = files.find((file) => file === `${name}.service.ts`);
    const found: DiscoveredAssembly = {
      name,
      directory: at,
      view: `${at}/${view}`,
      renderer: rendererForView(view) as string,
      client: client === undefined ? undefined : `${at}/${client}`,
      service: service === undefined ? undefined : `${at}/${service}`,
      styles: files.filter((file) => file.endsWith(".css")).map((file) => `${at}/${file}`),
    };
    assemblies.push(found);
    problems.push(
      ...outsideProblems(root, [found.view, found.client, found.service, ...found.styles]),
    );
  }
  return { assemblies, problems };
}
