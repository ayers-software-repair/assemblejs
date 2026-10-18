// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { GENERATED_HEADER } from "./generated-header.js";

/**
 * The one module the author's server file imports: everything the build found, the policy the
 * project's config declares (remotes, access, the content security policy; budgets are `perf`'s
 * and reach no server), the version of this build's output, where its browser files are, and the
 * not-found page when there is one. The asset directory is resolved from the built module's own
 * url, never from a working directory, so the server finds its files wherever it is started from.
 */
export function generateProject(options: {
  readonly version: string;
  readonly client: boolean;
  /** Whether the project has an assemblejs.config.ts, whose remotes it declares. */
  readonly config: boolean;
  /** The urls of the stylesheets every page links first, the project's tokens; none by default. */
  readonly styles?: readonly string[];
  /** Whether the project has a not-found page, which the pages module then exports. */
  readonly notFound?: boolean;
}): string {
  const assets = options.client
    ? `\n  assets: fileURLToPath(new URL("./client/", import.meta.url)),`
    : "";
  return `${GENERATED_HEADER}${options.client ? 'import { fileURLToPath } from "node:url";\n' : ""}import type { ServerOptions } from "@assemblejs/core";
import { apis } from "./apis.js";
import { assemblies } from "./assemblies.js";
import { ${options.notFound === true ? "notFound, " : ""}pages } from "./pages.js";${options.config ? '\nimport config from "../assemblejs.config.js";' : ""}

const project: ServerOptions = {${options.config ? "\n  ...config," : ""}
  assemblies,
  pages,${options.notFound === true ? "\n  notFound," : ""}
  apis,
  version: ${JSON.stringify(options.version)},${assets}${
    options.styles === undefined || options.styles.length === 0
      ? ""
      : `\n  styles: ${JSON.stringify(options.styles)},`
  }
};
export default project;
`;
}
