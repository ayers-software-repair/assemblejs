// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyView } from "./assembly-view.js";

/** An assembly, and every view it answers under. */
export interface AssemblyDefinition {
  readonly name: string;
  readonly views: Readonly<Record<string, AssemblyView>>;
}
