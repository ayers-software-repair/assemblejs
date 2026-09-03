// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Diagnostic } from "@assemblejs/core";

/**
 * What composing a page answered: the markup, and one account per placement.
 *
 * The diagnostics are the half an agent cannot get from the html. A page whose cart placement
 * fell back looks fine; the diagnostic is what says it did.
 */
export interface ComposedPage {
  readonly html: string;
  readonly diagnostics: readonly Diagnostic[];
  readonly problems: readonly string[];
}
