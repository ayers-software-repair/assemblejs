// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const LOOPBACK = /^(?:127(?:\.\d{1,3}){3}|::1|::ffff:127(?:\.\d{1,3}){3})$/i;

/**
 * Whether a connection came from this machine: its peer is a loopback address. A Host header can
 * say anything; where the connection came from cannot, so a client on another machine that sends
 * `Host: localhost` to a server listening beyond loopback is told apart by it.
 */
export function loopbackAddress(address: string | undefined): boolean {
  return LOOPBACK.test(address ?? "");
}
