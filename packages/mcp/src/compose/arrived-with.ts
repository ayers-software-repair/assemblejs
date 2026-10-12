// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a visitor arrives at a page with, beside the page itself: a value for each parameter of
 * its route, and a query. A page's services, and those of every assembly placed on it, are
 * given both, so a page composed or an assembly rendered with neither is one no visitor is
 * shown wherever a route has a parameter.
 */
export interface ArrivedWith {
  /** The route's parameters by name, as the route's own segments would give them. */
  readonly params?: Readonly<Record<string, string>>;
  /** The query, each name once. */
  readonly query?: Readonly<Record<string, string>>;
}
