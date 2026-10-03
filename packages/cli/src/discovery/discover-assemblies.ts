// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { DiscoveredAssembly } from "./discovered-assembly.js";
import { isDirectory } from "./is-directory.js";
import type { ProjectProblem } from "./project-problem.js";
import { rendererForView } from "./renderer-for-view.js";
import { suggestName } from "./suggest-name.js";

const NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Every assembly under a directory. A directory IS an assembly; there is nothing to register.
 *
 * The alternative was a hand-maintained list restating the directory tree, which is the largest
 * single piece of ceremony an author would otherwise carry, and the thing two people editing
 * different assemblies would always conflict in.
 *
 * A directory that cannot be an assembly is reported rather than skipped. Skipping is how an
 * author renames a file, loses their assembly, and finds out from a visitor.
 */
export function discoverAssemblies(root: string): {
  readonly assemblies: readonly DiscoveredAssembly[];
  readonly problems: readonly ProjectProblem[];
} {
  const assemblies: DiscoveredAssembly[] = [];
  const problems: ProjectProblem[] = [];

  let entries: string[];
  try {
    entries = readdirSync(root).sort();
  } catch {
    // No assemblies directory at all is an empty project, not a broken one.
    return { assemblies, problems };
  }

  for (const name of entries) {
    const directory = join(root, name);
    if (!isDirectory(directory)) continue;
    const at = `${root}/${name}`.replaceAll("\\", "/");
    if (!NAME.test(name)) {
      problems.push({
        path: at,
        rule: "directory-is-an-assembly",
        message: `"${name}" is not a usable assembly name; names are lower case, start with a letter, and use hyphens`,
        fix: `rename the directory to "${suggestName(name)}"`,
      });
      continue;
    }

    const files = readdirSync(directory).sort();
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
    if (views.length > 1) {
      problems.push({
        path: at,
        rule: "one-framework-per-assembly",
        message: `"${name}" has more than one view file: ${views.join(", ")}`,
        fix: "keep one view; a second framework is a second assembly",
      });
      continue;
    }

    const view = views[0] as string;
    const client = files.find((file) => file.endsWith(".client.ts"));
    const service = files.find((file) => file === `${name}.service.ts`);
    assemblies.push({
      name,
      directory: `${root}/${name}`.replaceAll("\\", "/"),
      view: `${root}/${name}/${view}`.replaceAll("\\", "/"),
      renderer: rendererForView(view) as string,
      client: client === undefined ? undefined : `${root}/${name}/${client}`.replaceAll("\\", "/"),
      service:
        service === undefined ? undefined : `${root}/${name}/${service}`.replaceAll("\\", "/"),
      styles: files
        .filter((file) => file.endsWith(".css"))
        .map((file) => `${root}/${name}/${file}`.replaceAll("\\", "/")),
    });
  }
  return { assemblies, problems };
}
