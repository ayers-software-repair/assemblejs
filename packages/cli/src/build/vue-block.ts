// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** What every block of a single-file component may say about itself. */
export interface VueBlock {
  readonly lang?: string;
  readonly src?: string;
}
