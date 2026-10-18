// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Whether a runtime started with this origin is the page's own, and not a remote server's. */
export function isOwnRuntime(origin: string | undefined): boolean {
  return origin === undefined || (typeof location !== "undefined" && origin === location.origin);
}
