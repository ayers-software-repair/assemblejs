// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyPlan } from "./assembly-plan.js";
import type { ContentCache } from "./content-cache.js";
import type { Fetch } from "./fetch.js";
import type { Limits } from "./limits.js";

/** Everything settling one placement needs, resolved by the composer from its own options. */
export interface SettleInput {
  readonly name: string;
  readonly view: string;
  readonly plan: AssemblyPlan | undefined;
  readonly fetch: Fetch;
  readonly cache: ContentCache | undefined;
  readonly limits: Limits;
  readonly page: string;
  readonly depth: number;
  readonly path: readonly string[];
  readonly query: URLSearchParams;
  readonly headers: Readonly<Record<string, string>>;
  readonly newId: () => string;
  readonly now: () => number;
}
