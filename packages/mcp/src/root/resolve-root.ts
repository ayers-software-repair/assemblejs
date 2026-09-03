// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { resolve } from "node:path";
import type { ProjectRoot } from "./project-root.js";

/** Resolves the one project root. Every path a tool touches is checked against this. */
export function resolveRoot(candidate: string): ProjectRoot {
  return { path: resolve(candidate), __brand: "ProjectRoot" };
}
