// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MountedAssembly } from "./mounted-assembly.js";

/** The page's one runtime. */
export interface Runtime {
  readonly mounted: ReadonlyMap<string, MountedAssembly>;
  /** Mounts every unmounted envelope under a root. Safe to call again for inserted markup. */
  mount(root: ParentNode): void;
  /** Tears every assembly down, in reverse mount order. */
  unmountAll(): void;
}
