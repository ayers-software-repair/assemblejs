// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The usable name nearest to one that is not: lower case, words joined by hyphens, starting with
 * a letter. `Cart Item` becomes `cart-item`, so a refusal can say what would work.
 */
export function suggestName(name: string): string {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word !== "");
  const joined = words.join("-").replace(/^[^a-z]+/, "");
  return joined === "" ? "assembly" : joined;
}
