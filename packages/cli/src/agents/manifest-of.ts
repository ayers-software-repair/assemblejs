// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const FIELDS = ["dependencies", "devDependencies", "optionalDependencies"] as const;

/**
 * What a `package.json` says that a project's agent files rest on: the package's name and
 * version, and every package it depends on, of any kind, with what it asks of each. None of
 * them from a manifest that is missing or cannot be read.
 */
export function manifestOf(source: string | undefined): {
  readonly name: string | undefined;
  readonly version: string | undefined;
  readonly dependencies: Readonly<Record<string, string>>;
} {
  let manifest: unknown;
  try {
    manifest = JSON.parse(source ?? "");
  } catch {
    manifest = undefined;
  }
  if (typeof manifest !== "object" || manifest === null) {
    return { name: undefined, version: undefined, dependencies: {} };
  }
  const read = manifest as Record<string, unknown>;
  const text = (value: unknown): string | undefined =>
    typeof value === "string" ? value : undefined;
  return {
    name: text(read["name"]),
    version: text(read["version"]),
    dependencies: Object.fromEntries(
      FIELDS.flatMap((field) => {
        const listed = read[field];
        return typeof listed === "object" && listed !== null
          ? Object.entries(listed).map(([name, asked]) => [name, String(asked)])
          : [];
      }),
    ),
  };
}
