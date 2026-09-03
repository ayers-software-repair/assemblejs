// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { MountHandle } from "./mount-handle.js";

/** One assembly the runtime is holding, and the handle that tears it down. */
export interface MountedAssembly {
  readonly id: string;
  readonly name: string;
  readonly view: string;
  readonly element: Element;
  readonly handle: MountHandle;
}
