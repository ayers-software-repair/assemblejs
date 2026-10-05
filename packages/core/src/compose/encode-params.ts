// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A page's route parameters as one string, the form a request header and a placeholder carry
 * them in: form encoded, each name once, in name order whatever order they were read in, so two
 * requests with the same parameters encode the same. Empty for none.
 */
export function encodeParams(params: Readonly<Record<string, string>>): string {
  const byName = ([a]: [string, string], [b]: [string, string]): number =>
    a < b ? -1 : a > b ? 1 : 0;
  return new URLSearchParams(Object.entries(params).sort(byName)).toString();
}
