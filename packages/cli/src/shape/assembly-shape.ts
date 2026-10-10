// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { COMPUTED } from "./computed.js";
import type { UNREAD } from "./unread.js";

/** One assembly as its sources say it, every path from the project's root. */
export interface AssemblyShape {
  readonly name: string;
  readonly directory: string;
  readonly view: string;
  /** Which renderer the view's file name chose. */
  readonly renderer: string;
  /** Its `.client.ts`, when it has one. */
  readonly client?: string;
  /** Its service, which runs on the server before the view renders, when it has one. */
  readonly service?: string;
  readonly styles: readonly string[];
  /** Whether it has a half that runs in the browser, as the placement rules take it. */
  readonly browserHalf: boolean;
  /**
   * What its view is known to place, each with the view it is placed with, COMPUTED for one
   * the source computes. COMPUTED whole where only a render knows what the view places, and
   * UNREAD where the view holds a placement that cannot be read.
   */
  readonly places:
    readonly { readonly name: string; readonly view: string }[] | typeof COMPUTED | typeof UNREAD;
  /** The pages whose templates place it. */
  readonly placedOn: readonly string[];
  /** The assemblies whose views are known to place it. */
  readonly placedIn: readonly string[];
}
