// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * One thing wrong with how a page places an assembly, with the name it is about and what is
 * wrong: the assembly or the view named, the policy declared, or, for a placement from another
 * server, its url, that url's origin, or where the template puts it. Whoever reports it chooses
 * a fix by that, without reading the message back.
 */
export interface PlacementProblem {
  /** The name the template writes, or the policy declares. */
  readonly name: string;
  readonly about: "assembly" | "view" | "policy" | "url" | "origin" | "form";
  readonly message: string;
}
