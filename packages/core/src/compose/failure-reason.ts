// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Why reaching an assembly produced no content. Every one of these is a failure, never a page.
 *
 * `depth` and `cycle` are refused by the parent before it dispatches, so they never reach a
 * transport; the rest are what a transport reported.
 */
export type FailureReason =
  "timeout" | "status" | "transport" | "content-type" | "too-large" | "invalid" | "depth" | "cycle";
