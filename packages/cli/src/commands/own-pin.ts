// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { ownManifest } from "@asmjs/build";

/**
 * The version of a tool the package a module belongs to was built and tested with, from its
 * own development dependencies: what a new project is given of TypeScript and of Node's
 * types, so a project starts on the versions this release was proven against and no number
 * is typed twice. The caller passes its `import.meta.url` and the tool's package name.
 */
export function ownPin(moduleUrl: string, name: string): string {
  const pin = ownManifest(moduleUrl).devDependencies[name];
  if (pin === undefined) throw new Error(`${name} is not a development dependency of this package`);
  return pin;
}
