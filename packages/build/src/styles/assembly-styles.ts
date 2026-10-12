// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Where one assembly's built stylesheets are served from. */
export interface AssemblyStyles {
  /** The stylesheet scoped to the assembly's envelope, linked in the page. */
  readonly scoped: string;
  /**
   * The stylesheet for the assembly's own shadow root, for a framework view, which can opt into
   * one; an html view cannot, and has none.
   */
  readonly shadow: string | undefined;
}
