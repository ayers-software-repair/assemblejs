// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What an agent is told about a name with no assembly behind it: the ones that do exist, since
 * one told only "not found" guesses, and one told what is there does not.
 */
export function noSuchAssembly(name: string, names: readonly string[]): string {
  return names.length === 0
    ? `there is no assembly "${name}", and this project has none at all yet`
    : `there is no assembly "${name}". This project has: ${names.join(", ")}`;
}
