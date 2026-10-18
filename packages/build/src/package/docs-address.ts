// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Where the product's documentation is published; a prerelease's is beneath it, under `next/`. */
const PRODUCT = "https://assemblejs.com/";

/**
 * The address of the documentation for the channel a version was published on: beneath
 * `/next/` for a prerelease, the product's own for a stable. A version is a prerelease when a
 * hyphen follows its patch number, before any build metadata, as the semver specification
 * writes it (item 9); the site publishes each channel at that address.
 */
export function docsAddress(version: string): string {
  const [precedence = ""] = version.split("+");
  return precedence.includes("-") ? `${PRODUCT}next/` : PRODUCT;
}
