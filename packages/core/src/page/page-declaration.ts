// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PagePlacement } from "./page-placement.js";

/**
 * What an author writes in a page's own file, beside its template: the route, when it is not
 * the one the directory implies, policy for any placement that needs it, and the stream its
 * runtime opens. All optional; a page whose template is enough needs no file at all.
 */
export interface PageDeclaration {
  readonly route?: string;
  readonly place?: Readonly<Record<string, PagePlacement>>;
  readonly stream?: string;
}
