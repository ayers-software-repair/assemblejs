// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What a service is given. Its own request, and nothing of any other assembly's. It holds no
 * headers or cookies: a service is a function of the address, so its answer can be kept and can
 * be the same from another server. Who is asking is for an api.
 */
export interface ServiceContext {
  readonly query: URLSearchParams;
  readonly params: Readonly<Record<string, string>>;
}
