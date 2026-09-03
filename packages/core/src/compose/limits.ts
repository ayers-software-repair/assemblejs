// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The bounds composition is refused outside of. Both are finite, always. */
export interface Limits {
  /** How many assemblies deep composition may go before a request is refused. */
  readonly depth: number;
  /** Bytes. A response larger than this is a failure, not a page. */
  readonly maxBytes: number;
}
