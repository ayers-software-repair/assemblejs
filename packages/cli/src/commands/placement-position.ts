// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Where a placement goes in a page template: at the start or the end of the body, or beside an
 * assembly the template already places. Named, never a line number, so it means the same thing
 * after someone else has edited the file.
 */
export type PlacementPosition =
  { readonly at: "start" | "end" } | { readonly after: string } | { readonly before: string };
