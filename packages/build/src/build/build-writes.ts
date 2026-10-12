// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a build writes in the project's generated directory, `.assemblejs`: the four modules the
 * server file imports, the browser entry and the directory of each assembly's browser module,
 * and the directory a build is made in before it replaces `dist`. A build removes these and
 * nothing else there, so what another command keeps beside them, dev's record of the server it
 * runs among it, outlives a build.
 */
export const BUILD_WRITES = [
  "assemblies.ts",
  "pages.ts",
  "apis.ts",
  "project.ts",
  "client.ts",
  "client",
  "building",
] as const;
