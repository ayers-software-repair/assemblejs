// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What an assembly's browser half is told about itself. */
export interface MountContext {
  readonly id: string;
  readonly name: string;
  readonly view: string;
}
