// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "./assembly-definition.js";

/** Identity, for inference and for a name at the point of declaration. */
export function defineAssembly(definition: AssemblyDefinition): AssemblyDefinition {
  return definition;
}
