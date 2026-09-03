// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** One assembly found on disk, and the files it is made of. */
export interface DiscoveredAssembly {
  readonly name: string;
  /** Directory, relative to the project root, with forward slashes. */
  readonly directory: string;
  /** The view file, relative to the project root. */
  readonly view: string;
  /** Which renderer the view's extension and infix chose. */
  readonly renderer: string;
  /** Optional siblings, relative to the project root. */
  readonly client: string | undefined;
  readonly styles: readonly string[];
}
