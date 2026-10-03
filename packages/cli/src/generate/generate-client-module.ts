// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { GENERATED_HEADER } from "./generated-header.js";
import { importPath } from "./import-path.js";

/**
 * One assembly's browser half, as its own module, so the bundler gives it its own file and the
 * page loads it only when that assembly mounts. A framework view is hydrated by its renderer's
 * browser half; a plain html view's behaviour is its `.client.ts`, which default-exports one.
 */
export function generateClientModule(
  assembly: DiscoveredAssembly,
  from: string,
  rendererPackage: string | undefined,
): string {
  if (assembly.renderer === "html") {
    return `${GENERATED_HEADER}export { default } from "${importPath(from, assembly.client ?? assembly.view)}";
`;
  }
  return `${GENERATED_HEADER}import { hydrate } from "${rendererPackage ?? `@assemblejs/renderer-${assembly.renderer}`}/client";
import View from "${importPath(from, assembly.view)}";

export default hydrate(View);
`;
}
