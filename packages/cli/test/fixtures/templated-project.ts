// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The example that installs the templates package.
const TEMPLATES = fileURLToPath(new URL("../../../../examples/templates/", import.meta.url));

/**
 * A project of these files, nested in the example that installs the templates package as a
 * project that installed it would be: whatever finds a package the way the bundler does finds
 * the example's. Its root joins `made`, for the spec that asked to remove when it ends. Given
 * another place to stand, it is a project with no templates package above it.
 */
export function templatedProject(
  made: string[],
  files: Readonly<Record<string, string>>,
  at = TEMPLATES,
): string {
  const root = mkdtempSync(join(at, ".dev-template-"));
  made.push(root);
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
}
