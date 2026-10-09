// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Everything that would make a deploy fail where it is installed, found before it is written:
 * a package the built server imports that the project does not list in its dependencies (one
 * listed only in devDependencies builds and is then missing), a subpath import the build left
 * for the runtime to resolve, which a deploy's package.json does not map, and a `workspace:` or
 * `catalog:` specifier, which only the workspace it came from can install.
 */
export function deployProblems(
  imports: readonly string[],
  project: Readonly<Record<string, unknown>>,
): readonly string[] {
  const field = (name: string): Readonly<Record<string, unknown>> => {
    const value = project[name];
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  };
  const dependencies = field("dependencies");
  const problems: string[] = [];
  for (const name of imports) {
    if (name.startsWith("#")) {
      problems.push(
        `the server imports ${name}, a subpath import the build did not resolve, which a deploy does not map: import the file or the package it names`,
      );
      continue;
    }
    if (Object.hasOwn(dependencies, name)) continue;
    problems.push(
      Object.hasOwn(field("devDependencies"), name)
        ? `the server imports ${name}, which package.json lists only in devDependencies: move it to dependencies`
        : `the server imports ${name}, which package.json does not list: add it to dependencies`,
    );
  }
  for (const [name, specifier] of Object.entries(dependencies)) {
    if (/^(workspace|catalog):/.test(String(specifier))) {
      problems.push(
        `${name} is "${String(specifier)}", which only its workspace can install: give it a version`,
      );
    }
  }
  return problems;
}
