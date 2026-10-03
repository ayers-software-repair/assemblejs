// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { PagePlacement } from "./page-placement.js";

/**
 * A route that renders a template which places assemblies.
 *
 * The template is the whole document. There is no layout: a shared head, nav or footer is an
 * assembly the page places, so there is one composition concept and not two.
 */
export interface PageDefinition {
  /** A flat route with parameters, `/products/:id`. */
  readonly route: string;
  readonly template: string;
  /** Policy per placement, keyed by the name the template writes. */
  readonly place?: Readonly<Record<string, PagePlacement>>;
}
