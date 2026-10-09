// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What one thing a page sends weighs: its bytes as sent, and gzipped. */
export interface AssetWeight {
  readonly bytes: number;
  readonly gzip: number;
}
