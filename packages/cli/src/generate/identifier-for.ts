// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A safe identifier for something the generated modules import: `identifierFor("view",
 * "hello-react")` is `view_hello_react`. A name can hold only lower case letters, digits and
 * hyphens, so writing each hyphen as an underscore gives every name its own identifier: `x-1`
 * and `x1` are `view_x_1` and `view_x1`, never one import standing in for the other.
 */
export function identifierFor(kind: string, name: string): string {
  return `${kind}_${name.replaceAll("-", "_")}`;
}
