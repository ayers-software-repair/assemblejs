// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Why reaching an assembly produced no content. Every one of these is a failure, never a page.
 *
 * `depth`, `cycle`, `too-many`, `access` and `aborted` are refused by the parent before it
 * dispatches, so they never reach a transport; the rest are what a transport reported. `access`
 * is the one that is no failure of the assembly's: this visitor may not be shown it. `aborted`
 * is the request's own end: its asker left, or a parent's deadline passed, before this
 * placement was dispatched, so nothing was.
 */
export type FailureReason =
  | "timeout"
  | "status"
  | "transport"
  | "content-type"
  | "too-large"
  | "invalid"
  | "depth"
  | "cycle"
  | "too-many"
  | "access"
  | "aborted";
