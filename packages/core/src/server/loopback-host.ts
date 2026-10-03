// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const LOOPBACK = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i;

/**
 * Whether a request's Host names this machine's loopback, whatever its port. A page on another
 * site that points its own name at 127.0.0.1 (DNS rebinding) reaches a local server under that
 * name, and is told apart by it.
 */
export function loopbackHost(host: string | undefined): boolean {
  const name = (host ?? "").replace(/:\d+$/, "");
  return LOOPBACK.test(name);
}
