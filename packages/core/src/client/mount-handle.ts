// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Returned by mount, and called by the runtime. A teardown nothing invokes is not a teardown. */
export interface MountHandle {
  unmount(): void;
  /**
   * When the browser half is live, where that is later than this handle: its module is still
   * on its way. Settles when it has mounted, and rejects where it never will. Absent, the half
   * was live when `mount` returned.
   */
  readonly mounted?: Promise<void>;
}
