// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The four headers that carry composition state between a parent and a child.
 *
 * They are ordinary request headers with no privilege attached. An outside caller may send them
 * and gets exactly the behaviour an internal caller gets, because a route that behaves one way
 * for "internal" traffic is a route whose security depends on a header anyone can set.
 */
export const COMPOSITION_HEADER = {
  /** Opaque id of the page being composed. Present means "you are a fragment". */
  page: "assembly-page",
  /** The id this instance must stamp on its envelope, allocated by the parent. */
  id: "assembly-id",
  /** How many assemblies deep this request is. */
  depth: "assembly-depth",
  /** Ancestor identities, innermost last, comma separated. */
  path: "assembly-path",
} as const;
