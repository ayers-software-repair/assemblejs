// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { basename } from "node:path";
import { GENERATED_HEADER } from "./generated-header.js";
import { identifierFor } from "./identifier-for.js";
import { importPath } from "./import-path.js";

/** The module the built server imports its apis from, one default export per api file. */
export function generateApis(apis: readonly string[], from: string): string {
  const names = apis.map((file) => identifierFor("api", basename(file, ".api.ts")));
  const imports = apis.map(
    (file, index) => `import ${names[index]} from "${importPath(from, file)}";`,
  );
  return `${GENERATED_HEADER}
import type { ApiDefinition } from "@assemblejs/core";
${imports.join("\n")}

export const apis: readonly ApiDefinition[] = [${names.join(", ")}];
`;
}
