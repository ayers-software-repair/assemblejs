// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a build writes in the project's generated directory, `.assemblejs`: the modules the
 * server file imports, the registry's module for each owner of JSX, the browser entry and the
 * directory of each assembly's browser module, the TypeScript setup, and the directory a build
 * is made in before it replaces `dist`. A build removes these and nothing else there, so what
 * another command keeps beside them, dev's record of the server it runs among it, outlives a
 * build, and so do the declarations the compiler writes under `types`, which it keeps current
 * itself.
 */
export const BUILD_WRITES = [
  "assemblies.ts",
  "assemblies.react.ts",
  "assemblies.preact.ts",
  "assemblies.solid.ts",
  "pages.ts",
  "apis.ts",
  "project.ts",
  "client.ts",
  "client",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.shared.json",
  "tsconfig.react.json",
  "tsconfig.preact.json",
  "tsconfig.solid.json",
  "building",
] as const;
