// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What producing an assembly's data is given. Its own query, and nothing of the page's. */
export interface DataInput {
  readonly query: URLSearchParams;
}
