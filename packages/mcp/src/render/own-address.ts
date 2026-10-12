// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { networkInterfaces } from "node:os";
import { loopbackHost } from "@assemblejs/core";

/**
 * Whether a url's host, with its port or without, is this machine's own: a loopback name, or an
 * address of one of its interfaces, which is where a dev server told to listen on one of them is.
 * Any other host is another machine's, whatever a record under the project says of it.
 */
export function ownAddress(host: string): boolean {
  if (loopbackHost(host)) return true;
  const name = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return Object.values(networkInterfaces()).some((addresses) =>
    (addresses ?? []).some((one) => one.address === name),
  );
}
