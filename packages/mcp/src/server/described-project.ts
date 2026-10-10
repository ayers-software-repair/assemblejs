// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ProjectShape } from "@assemblejs/cli";

/**
 * A project's whole shape as an agent reads it: where it is, and everything its sources say of
 * its pages, its assemblies, its apis and its settings, every path from the project's root.
 */
export interface DescribedProject extends ProjectShape {
  readonly root: string;
}
