// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { PlacementCount } from "./placement-count.js";

/** One request for one assembly, whether it is answered in this process or over HTTP. */
export interface AssemblyRequest {
  readonly name: string;
  readonly view: string;
  /** Allocated by the parent, so the parent can address the result before it arrives. */
  readonly id: string;
  /** The page being composed. */
  readonly page: string;
  /** How many assemblies deep this request is. */
  readonly depth: number;
  /**
   * Ancestor IDENTITIES, innermost last, each `name/view`. A target already on the path is a
   * cycle and the parent refuses it before dispatch.
   *
   * Identities, not instance ids: an instance id is minted fresh per request, so a path of them
   * can never collide and the cycle check it was meant to perform would silently never fire.
   */
  readonly path: readonly string[];
  readonly query: URLSearchParams;
  /** The page's route parameters, which the assembly's services are given. */
  readonly params: Readonly<Record<string, string>>;
  readonly headers: Readonly<Record<string, string>>;
  readonly signal: AbortSignal;
  /**
   * The count of the request this one belongs to, for a transport that renders in this
   * process to hand on: the children are then counted with their parent's request. Never sent
   * to another server, whose own request has a count of its own.
   */
  readonly count?: PlacementCount;
}
