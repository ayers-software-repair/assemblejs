// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { GENERATED_HEADER } from "./generated-header.js";

/**
 * The one module the author's server file imports: everything the build found, the policy the
 * project's config declares (remotes, access, the content security policy; budgets are `perf`'s
 * and reach no server), the version of this build's output, and where its browser files are. The
 * asset directory is resolved from the built module's own url, never from a working directory,
 * so the server finds its files wherever it is started from.
 */
export function generateProject(options: {
  readonly version: string;
  readonly client: boolean;
  /** Whether the project has an assemblejs.config.ts, whose remotes it declares. */
  readonly config: boolean;
}): string {
  const assets = options.client
    ? `\n  assets: fileURLToPath(new URL("./client/", import.meta.url)),`
    : "";
  return `${GENERATED_HEADER}${options.client ? 'import { fileURLToPath } from "node:url";\n' : ""}import type { ServerOptions } from "@assemblejs/core";
import { apis } from "./apis.js";
import { assemblies } from "./assemblies.js";
import { pages } from "./pages.js";${options.config ? '\nimport config from "../assemblejs.config.js";' : ""}

const project: ServerOptions = {${options.config ? "\n  ...config," : ""}
  assemblies,
  pages,
  apis,
  version: ${JSON.stringify(options.version)},${assets}
};
export default project;
`;
}
