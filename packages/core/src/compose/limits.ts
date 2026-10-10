// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The bounds composition is refused outside of. Each is finite, always. */
export interface Limits {
  /** How many assemblies deep composition may go before a request is refused. */
  readonly depth: number;
  /** Bytes. A response larger than this is a failure, not a page. */
  readonly maxBytes: number;
  /**
   * How many assemblies one request may place, at every depth together: a page's own, and
   * those of every view composed for it in this process. One numbered past it is refused.
   */
  readonly placements: number;
}
