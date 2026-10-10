// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The attributes of the envelope, the whole set: four on every envelope, and five added only
 * where they apply. The server writes each and the browser, a composing server and the tools
 * read each by the same name, so the names are spelled here once.
 */
export const ENVELOPE_ATTRIBUTE = {
  /** The assembly the envelope wraps. */
  name: "data-name",
  /** The id of this instance, which its data island carries too. */
  id: "data-id",
  /** The view the assembly was rendered with. */
  view: "data-view",
  /** The renderer its browser half is mounted by. */
  renderer: "data-renderer",
  /** The origin it came from, where the assembly is another server's. */
  remote: "data-remote",
  /** Present while the content has not been fetched: the browser fills it after load. */
  defer: "data-defer",
  /** The page's route parameters, on a deferred envelope, for the fetch that fills it. */
  params: "data-params",
  /** Present on a fallback; its value is the correlation id the failure is logged against. */
  failed: "data-failed",
  /** When the browser half runs, where that is not on load. */
  mount: "data-mount",
} as const;
