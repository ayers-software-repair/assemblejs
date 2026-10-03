// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The function of the Solid renderer's compiler a build calls, typed here so the command line
 * carries no dependency on Solid or Babel: the project's own renderer is loaded, and only when it
 * has a Solid view. It takes JSX with the types already stripped.
 */
export type SolidCompile = (
  source: string,
  options: { readonly filename: string; readonly side: "client" | "server" },
) => string;
