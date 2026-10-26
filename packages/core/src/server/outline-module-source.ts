// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

/**
 * The module that draws an outline, as this package publishes it for a browser: read from the
 * package's own build, found by the name a browser's bundler would find it by, so a server
 * serves the one file whether it runs from that build or beside the source it was built from.
 */
export function outlineModuleSource(): string {
  const published = createRequire(import.meta.url).resolve("@asmjs/core/outline");
  return readFileSync(published, "utf8");
}
