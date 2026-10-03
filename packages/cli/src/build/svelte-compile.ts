// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The one function of the Svelte compiler a build calls, typed here so the command line carries
 * no dependency on Svelte: the project's own copy is loaded, and only when it has a Svelte view.
 */
export type SvelteCompile = (
  source: string,
  options: { readonly filename: string; readonly generate: "client" | "server" },
) => { readonly js: { readonly code: string }; readonly css?: { readonly code: string } | null };
