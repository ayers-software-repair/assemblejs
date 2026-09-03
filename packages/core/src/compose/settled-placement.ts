// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "./diagnostic.js";

/** One placement's outcome: the html to substitute, and the account of how it was reached. */
export interface SettledPlacement {
  readonly html: string;
  readonly diagnostic: Diagnostic;
}
