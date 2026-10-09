// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The project as devtools may read it: names, routes and settings, and nothing that runs or
 * holds a secret. No function, no credential, no template source.
 */
export interface ProjectSummary {
  readonly mode: "development" | "production";
  readonly version: string;
  readonly assemblies: readonly {
    readonly name: string;
    readonly views: readonly { readonly name: string; readonly renderer: string }[];
    readonly mount: string;
    readonly shadow: boolean;
  }[];
  readonly pages: readonly { readonly route: string; readonly stream: string | undefined }[];
  readonly apis: readonly {
    readonly method: string;
    readonly path: string;
    readonly streams: boolean;
  }[];
  readonly remotes: readonly { readonly origin: string }[];
}
