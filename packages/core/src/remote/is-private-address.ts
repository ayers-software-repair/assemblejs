// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { BlockList, isIP } from "node:net";

// Everything that is not out on the public internet: unspecified, private, shared, loopback,
// link-local, protocol assignments, documentation, benchmarking, multicast, reserved and
// broadcast for IPv4; unspecified, loopback, unique-local, link-local, site-local, multicast and
// the NAT64 prefixes, which lead to IPv4 addresses of any kind, for IPv6.
const INSIDE = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  INSIDE.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["fec0::", 10],
  ["ff00::", 8],
  ["64:ff9b::", 96],
  ["64:ff9b:1::", 48],
] as const) {
  INSIDE.addSubnet(network, prefix, "ipv6");
}

/**
 * Whether an address is somewhere inside the network the server runs in, or otherwise not out on
 * the internet a remote is expected to be on. The block list reads every spelling of an IPv6
 * address, zeros written out and IPv4 addresses mapped in dotted or hex form included.
 */
export function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return INSIDE.check(address, "ipv4");
  return version === 6 && INSIDE.check(address, "ipv6");
}
