// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ownManifest } from "./own-manifest.js";

/**
 * The version of the package a module belongs to, from that package's own manifest, the one
 * place a version is written. The caller passes its `import.meta.url`, and the same function
 * serves every package that imports it.
 */
export function ownVersion(moduleUrl: string): string {
  return ownManifest(moduleUrl).version;
}
