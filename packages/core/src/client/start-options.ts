// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ClientRenderer } from "./client-renderer.js";

/** What the browser runtime is started with. */
export interface StartOptions {
  /** The browser half of each renderer, keyed by the name the envelope declares. */
  readonly renderers: Readonly<Record<string, ClientRenderer>>;
  /** Where to look. The document, unless a caller is mounting one subtree. */
  readonly root?: ParentNode;
}
