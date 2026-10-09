// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MountMode } from "../client/mount-mode.js";
import type { AssemblyAssets } from "./assembly-assets.js";
import type { AssemblyView } from "./assembly-view.js";

/** An assembly, and every view it answers under. */
export interface AssemblyDefinition {
  readonly name: string;
  readonly views: Readonly<Record<string, AssemblyView>>;
  /** When its browser half runs. `load` unless it says otherwise. */
  readonly mount?: MountMode;
  readonly assets?: AssemblyAssets;
  /**
   * Rendered inside its own shadow root, for hard isolation: no page style reaches in, and its
   * styles, linked inside that root, reach nothing outside it.
   */
  readonly shadow?: boolean;
}
