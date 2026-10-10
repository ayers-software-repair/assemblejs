// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyDefinition } from "../assembly/assembly-definition.js";
import type { Fetch } from "../compose/fetch.js";
import type { Limits } from "../compose/limits.js";
import type { PlacementCount } from "../compose/placement-count.js";

/**
 * The composition state one local render is given: which placement it is, how deep its request
 * already is and who its ancestors are, and how the children its own view places are reached.
 *
 * Depth and path are required, never defaulted. A render that composed its children at depth
 * zero with no ancestors would let a view place itself without end, so there is no value to
 * fall back to: whoever renders an assembly says where in the composition it stands.
 */
export interface LocalRenderInput {
  /** The placement's id, which its envelope carries. */
  readonly id: string;
  /** The page being composed. */
  readonly page: string;
  /** How deep this assembly's own request is, as it arrived. Its children are one deeper. */
  readonly depth: number;
  /** Its ancestors' identities, innermost last, as they arrived. It adds its own for its children. */
  readonly path: readonly string[];
  readonly query: URLSearchParams;
  /** The page's route parameters, which its services and its children's are given. */
  readonly params: Readonly<Record<string, string>>;
  /** How a child its view places is reached: this server's own transport. */
  readonly fetch: Fetch;
  /**
   * This server's assemblies, by name: a shadow assembly links, inside its own root, the
   * stylesheets of the children placed there, and reads what they declare from these.
   */
  readonly assemblies: ReadonlyMap<string, AssemblyDefinition>;
  /** The server's bounds, the same that refuse a request on arrival. */
  readonly limits: Limits;
  /** The signal of the request this render belongs to: once it aborts, no further child is dispatched. */
  readonly signal?: AbortSignal;
  /**
   * The count of the request this render belongs to, so its children are counted with the
   * rest of that request. A render that is itself what was asked for has none, and its
   * children begin the count.
   */
  readonly count?: PlacementCount;
  /** Allocates each child's id, so its envelope can be addressed before it arrives. */
  readonly newId: () => string;
  /** Milliseconds since any fixed origin, for a child's elapsed time. */
  readonly now: () => number;
}
