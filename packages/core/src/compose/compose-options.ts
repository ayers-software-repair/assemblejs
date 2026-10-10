// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyPlan } from "./assembly-plan.js";
import type { ContentCache } from "./content-cache.js";
import type { Fetch } from "./fetch.js";
import type { Limits } from "./limits.js";
import type { PlacementCount } from "./placement-count.js";

/**
 * Everything composing a page needs. No HTTP, no framework, no filesystem, and no clock or id
 * source it does not own: a function that reads the wall clock cannot be asserted on, and a
 * function that mints its own ids cannot be replayed.
 */
export interface ComposeOptions {
  readonly template: string;
  /** Policy per placement, keyed by the name the template writes. A local one may be absent. */
  readonly plan: Readonly<Record<string, AssemblyPlan>>;
  readonly fetch: Fetch;
  readonly cache?: ContentCache;
  readonly limits?: Limits;
  /** The page being composed. */
  readonly page: string;
  /** How deep this page already is. A page is zero; an assembly composing children is its own. */
  readonly depth?: number;
  /** Ancestor identities, each `name/view`, innermost last. A target already on it is a cycle. */
  readonly path?: readonly string[];
  /**
   * The signal of the request this composition belongs to. Once it aborts, no further placement
   * is dispatched, and a transport already called hears it through the signal it was given.
   */
  readonly signal?: AbortSignal;
  /**
   * The count of the request this composition belongs to, when another composition of that
   * request began it. Without one this composition begins the count, hands it on to whatever
   * its placements compose in this process, and gives the one account of what was refused.
   */
  readonly count?: PlacementCount;
  readonly query?: URLSearchParams;
  /** The page's route parameters, `{ id: "42" }` for `/products/:id`, handed to every placement. */
  readonly params?: Readonly<Record<string, string>>;
  readonly headers?: Readonly<Record<string, string>>;
  /** Allocates a child's id, so the parent can address the result before it arrives. */
  readonly newId: () => string;
  /** Milliseconds since any fixed origin. Used only for a diagnostic's elapsed time. */
  readonly now: () => number;
}
