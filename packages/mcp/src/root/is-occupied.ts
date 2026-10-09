// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { lstatSync } from "node:fs";

/**
 * Whether anything is at a path, a link that points at nothing included. Such a link is not a
 * free place to write: a write through it lands at its target, or fails with an error the agent
 * cannot act on.
 */
export function isOccupied(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch {
    return false;
  }
}
