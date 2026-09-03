// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The composition state a request arrived carrying, once every value has been checked.
 *
 * `page` absent means this request is the page itself rather than a fragment of one.
 */
export interface CompositionHeaders {
  readonly page: string | undefined;
  readonly id: string | undefined;
  readonly depth: number;
  readonly path: readonly string[];
}
