// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join } from "node:path";
import type { DiscoveredAssembly } from "@asmjs/build";
import { isStaticView } from "@asmjs/build";
import { readViewMount } from "./read-view-mount.js";

/**
 * Whether an assembly has a half that runs in the browser, as far as its sources say: a static
 * view with a `.client.ts` beside it, or a framework view that does not declare
 * `mount = "none"` for itself. A mount the view computes, or one in a view that cannot be read,
 * is taken as one that mounts, which is how the placement rules take it.
 */
export async function hasBrowserHalf(root: string, assembly: DiscoveredAssembly): Promise<boolean> {
  if (isStaticView(assembly.renderer)) return assembly.client !== undefined;
  const view = isAbsolute(assembly.view) ? assembly.view : join(root, assembly.view);
  return (await readViewMount(root, view)) !== "none";
}
