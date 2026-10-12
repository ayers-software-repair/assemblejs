// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The `pnpm-workspace.yaml` a project made by pnpm starts with. pnpm refuses an install while a
 * dependency's install script has not been ruled on, and the bundler the command line builds
 * with has one. It is ruled out here: the build reaches the bundler's binary without it, so
 * the project installs clean and runs nothing it does not need.
 */
export const PNPM_SETTINGS = `# pnpm asks for a ruling on every dependency that has an install script, and fails the install
# until it has one. esbuild's is not needed: the build reaches its binary without it.
allowBuilds:
  esbuild: false
`;
