// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { JsonObject } from "@assemblejs/core";

/**
 * What rendering an assembly answered.
 *
 * The html AND the data AND the account, together, because the question an agent is actually
 * asking is "did what I just wrote work", and any one of the three alone leaves that open.
 */
export interface RenderedAssembly {
  readonly name: string;
  readonly view: string;
  readonly renderer: string;
  readonly html: string;
  readonly data: JsonObject;
  /** Empty when it rendered. Otherwise what stopped it, in terms an agent can act on. */
  readonly problems: readonly string[];
}
