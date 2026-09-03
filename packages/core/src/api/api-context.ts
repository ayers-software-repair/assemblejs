// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What an api handler is given. */
export interface ApiContext {
  readonly query: URLSearchParams;
  readonly params: Readonly<Record<string, string>>;
}
