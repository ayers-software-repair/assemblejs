// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "./assembly-definition.js";
import type { AssemblyView } from "./assembly-view.js";

/**
 * The view an assembly declared under a name, or nothing.
 *
 * A view's name arrives in a url and in a directive, so it is whatever the asker wrote, and
 * every object answers to `constructor` and `toString`. The view is read as the assembly's own
 * property and never through the object, so only a view its author wrote is one it has.
 */
export function declaredView(assembly: AssemblyDefinition, view: string): AssemblyView | undefined {
  return Object.hasOwn(assembly.views, view) ? assembly.views[view] : undefined;
}
