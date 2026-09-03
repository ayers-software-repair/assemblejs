// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const CREDENTIAL_HEADERS = ["authorization", "cookie", "proxy-authorization"];

/**
 * Whether a request carries something personal to one visitor. A response to such a request is
 * never cached and never served from cache, because a shared cache keyed on a URL will hand one
 * visitor another visitor's page.
 */
export function carriesCredential(headers: Readonly<Record<string, string>>): boolean {
  return Object.keys(headers).some((key) => CREDENTIAL_HEADERS.includes(key.toLowerCase()));
}
