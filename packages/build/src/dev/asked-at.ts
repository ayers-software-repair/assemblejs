// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The address a dev server is asked at from this machine: the one it said it listens on, or,
 * where it said every interface, this machine's loopback of the same family.
 *
 * `0.0.0.0` and `[::]` mean all of a machine's addresses to the one listening, and name none of
 * them to one asking. What `dev` records is for the agent surface to ask, and it asks this
 * machine alone, so it is recorded as an address that can be asked.
 */
export function askedAt(url: string): string {
  let said: URL;
  try {
    said = new URL(url);
  } catch {
    return url;
  }
  if (said.hostname === "0.0.0.0") said.hostname = "127.0.0.1";
  else if (said.hostname === "[::]") said.hostname = "[::1]";
  else return url;
  return said.origin;
}
