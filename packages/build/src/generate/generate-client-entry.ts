// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import { GENERATED_HEADER } from "./generated-header.js";

/**
 * The page's one script: any setup a framework needs loaded first, then the runtime, started
 * with a browser half that loads each assembly's own module by name the first time it mounts,
 * owning the envelopes from the origin it was served from.
 */
export function generateClientEntry(
  assemblies: readonly DiscoveredAssembly[],
  setups: readonly string[] = [],
): string {
  const modules = assemblies
    .map(
      (assembly) =>
        `  ${JSON.stringify(assembly.name)}: () => import("./client/${assembly.name}.js"),`,
    )
    .join("\n");
  const renderers = [...new Set(assemblies.map((assembly) => assembly.renderer))]
    .sort()
    .map((renderer) => `${JSON.stringify(renderer)}: renderer`)
    .join(", ");
  // Static imports first: they load before this module's own code and before any assembly's
  // module, so a framework that needs something installed before it loads gets it.
  const setup = [...new Set(setups)]
    .map((module) => `import ${JSON.stringify(module)};\n`)
    .join("");
  return `${GENERATED_HEADER}${setup}import { lazyRenderer, start } from "@assemblejs/core/client";

const renderer = lazyRenderer({
${modules}
});

// The origin this script came from, so a page that also places another server's assemblies
// mounts each with the runtime that came from its own server.
start({ renderers: { ${renderers} }, origin: new URL(import.meta.url).origin });
`;
}
