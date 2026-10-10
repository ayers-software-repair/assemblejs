// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { relative } from "node:path";

/**
 * A path as a finding or a shape shows it: from the project's root, with forward slashes on
 * every platform. The root itself is `.`.
 */
export function fromRoot(root: string, path: string): string {
  return relative(root, path).split("\\").join("/") || ".";
}
