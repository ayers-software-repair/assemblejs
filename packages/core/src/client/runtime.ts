// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Bus } from "./events/bus.js";
import type { MountedAssembly } from "./mounted-assembly.js";

/** The page's one runtime. */
export interface Runtime {
  readonly mounted: ReadonlyMap<string, MountedAssembly>;
  /** The page's one bus, which every assembly talks through. */
  readonly bus: Bus;
  /** Mounts every unmounted envelope under a root. Safe to call again for inserted markup. */
  mount(root: ParentNode): void;
  /** Tears every assembly down, in reverse mount order. */
  unmountAll(): void;
}
