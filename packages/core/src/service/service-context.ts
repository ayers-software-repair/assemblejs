// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What a service is given. Its own request, and nothing of any other assembly's. */
export interface ServiceContext {
  readonly query: URLSearchParams;
  readonly params: Readonly<Record<string, string>>;
}
