// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { UNREAD } from "./unread.js";
import type { Written } from "./written.js";

/** One page as its sources say it, every path from the project's root. */
export interface PageShape {
  readonly name: string;
  /**
   * Where it answers: the route its directory implies, or the one its declaration writes.
   * COMPUTED where the declaration computes it, UNREAD where that file cannot be read.
   */
  readonly route: string;
  readonly template: string;
  /** `<name>.page.ts`, when the page has one. */
  readonly declaration?: string;
  /**
   * What its template places, in the template's order, each with the view it is placed with.
   * UNREAD for a template that is not there or holds a placement that cannot be read.
   */
  readonly places: readonly { readonly name: string; readonly view: string }[] | typeof UNREAD;
  /**
   * The policy its declaration gives each placement, by the placement's name, as written:
   * empty where it gives none, UNREAD where the declaration cannot be read.
   */
  readonly policy: Written;
  /** The path of the stream it opens, as written; null where it opens none. */
  readonly stream: Written;
}
