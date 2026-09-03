// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** An assembly's stable identity, which is what an ancestor path carries and a cache keys on. */
export function identity(name: string, view: string): string {
  return `${name}/${view}`;
}
