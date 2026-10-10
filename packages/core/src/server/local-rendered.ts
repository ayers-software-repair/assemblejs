// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "../compose/diagnostic.js";

/** One assembly rendered in this process: its envelope, and the account of its children. */
export interface LocalRendered {
  /** The envelope, each child its view placed already in its own envelope inside it. */
  readonly html: string;
  /** One per placement the view made, in the view's order; empty when it placed nothing. */
  readonly diagnostics: readonly Diagnostic[];
}
