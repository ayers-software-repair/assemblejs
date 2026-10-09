// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, relative, resolve } from "node:path";

/**
 * The package.json a deploy carries, made from the project's own: its name, version and
 * dependencies, and nothing a running server does not need. No devDependencies, so an install
 * of the deploy brings no bundler; one script, `start`, which runs what production runs. A local
 * `file:` or `link:` dependency is pointed from where the deploy is written, `out`, rather
 * than from the project.
 */
export function deployPackage(
  project: Readonly<Record<string, unknown>>,
  root: string,
  out: string,
): Record<string, unknown> {
  const engines = project["engines"];
  const declared = project["dependencies"];
  const dependencies = Object.fromEntries(
    Object.entries(typeof declared === "object" && declared !== null ? declared : {}).map(
      ([name, specifier]) => {
        const local = /^(file|link):(.+)$/.exec(String(specifier));
        if (local === null || isAbsolute(local[2] ?? "")) return [name, specifier];
        const moved = relative(out, resolve(root, local[2] ?? ""))
          .split("\\")
          .join("/");
        return [name, `${local[1]}:${moved}`];
      },
    ),
  );
  return {
    name: typeof project["name"] === "string" ? project["name"] : "assemblejs-app",
    version: typeof project["version"] === "string" ? project["version"] : "0.0.0",
    private: true,
    type: "module",
    engines: typeof engines === "object" && engines !== null ? engines : { node: ">=22" },
    scripts: { start: "node dist/server.js" },
    dependencies,
  };
}
