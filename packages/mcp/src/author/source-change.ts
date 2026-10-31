// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Exact UTF-8 source content; null means the reviewed target must not exist. */
export interface SourceChange {
  readonly path: string;
  readonly before: string | null;
  readonly after: string;
}
