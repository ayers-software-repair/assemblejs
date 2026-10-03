// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The package.json a deploy carries, made from the project's own: its name, version and
 * dependencies, and nothing a running server does not need. No devDependencies, so an install
 * of the deploy brings no bundler; one script, `start`, which runs what production runs.
 */
export function deployPackage(project: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const engines = project["engines"];
  return {
    name: typeof project["name"] === "string" ? project["name"] : "assemblejs-app",
    version: typeof project["version"] === "string" ? project["version"] : "0.0.0",
    private: true,
    type: "module",
    engines: typeof engines === "object" && engines !== null ? engines : { node: ">=22" },
    scripts: { start: "node dist/server.js" },
    dependencies: project["dependencies"] ?? {},
  };
}
