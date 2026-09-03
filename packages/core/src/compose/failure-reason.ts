// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Why reaching an assembly did not produce content. Every one of these is a failure, never a page. */
export type FailureReason =
  "timeout" | "status" | "transport" | "content-type" | "too-large" | "invalid";
