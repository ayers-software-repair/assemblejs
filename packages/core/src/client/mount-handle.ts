// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Returned by mount, and called by the runtime. A teardown nothing invokes is not a teardown. */
export interface MountHandle {
  unmount(): void;
}

import "../compose/limits.js";
