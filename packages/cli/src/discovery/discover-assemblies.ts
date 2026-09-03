// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { DiscoveredAssembly } from "./discovered-assembly.js";
import { rendererForView } from "./renderer-for-view.js";

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
  readonly problems: readonly string[];
} {
  const assemblies: DiscoveredAssembly[] = [];
  const problems: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(root).sort();
  } catch {
    // No assemblies directory at all is an empty project, not a broken one.
    return { assemblies, problems };
  }

  for (const name of entries) {
    const directory = join(root, name);
    if (!statSync(directory).isDirectory()) continue;
    if (!NAME.test(name)) {
      problems.push(
        `"${name}" is not a usable assembly name; names are lower case, start with a letter, and use hyphens`,
      );
      continue;
    }

    const files = readdirSync(directory).sort();
    const views = files.filter(
      (file) => rendererForView(file) !== undefined && !file.endsWith(".client.ts"),
    );
    if (views.length === 0) {
      problems.push(`"${name}" has no view file, so nothing can render it`);
      continue;
    }
    if (views.length > 1) {
      problems.push(`"${name}" has more than one view file: ${views.join(", ")}`);
      continue;
    }

    const view = views[0] as string;
    const client = files.find((file) => file.endsWith(".client.ts"));
    assemblies.push({
      name,
      directory: `${root}/${name}`.replaceAll("\\", "/"),
      view: `${root}/${name}/${view}`.replaceAll("\\", "/"),
      renderer: rendererForView(view) as string,
      client: client === undefined ? undefined : `${root}/${name}/${client}`.replaceAll("\\", "/"),
      styles: files
        .filter((file) => file.endsWith(".css"))
        .map((file) => `${root}/${name}/${file}`.replaceAll("\\", "/")),
    });
  }
  return { assemblies, problems };
}
