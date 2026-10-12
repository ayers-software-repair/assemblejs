// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What deciding whether a request may proceed is given: no body, nothing parsed yet. */
export interface AccessRequest {
  readonly method: string;
  /** The path as the router reads it: without its query, and decoded. */
  readonly path: string;
  readonly headers: Readonly<Record<string, string | undefined>>;
}
