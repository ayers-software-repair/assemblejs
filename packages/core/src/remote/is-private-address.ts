// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isIP } from "node:net";

const V4: ReadonlyArray<readonly [number, number, number]> = [
  // [first octet, second-octet floor, second-octet ceiling]
  [0, 0, 255],
  [10, 0, 255],
  [127, 0, 255],
  [169, 254, 254],
  [172, 16, 31],
  [192, 168, 168],
  [100, 64, 127],
];

/**
 * Whether an address is loopback, link-local, private or unspecified: somewhere inside the
 * network the server runs in, rather than out on the internet a remote is expected to be on.
 */
export function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const [a = 0, b = 0] = address.split(".").map(Number);
    return V4.some(([first, low, high]) => a === first && b >= low && b <= high);
  }
  if (version === 6) {
    const lower = address.toLowerCase();
    if (lower.startsWith("::ffff:")) return isPrivateAddress(lower.slice("::ffff:".length));
    return lower === "::" || lower === "::1" || /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower);
  }
  return false;
}
