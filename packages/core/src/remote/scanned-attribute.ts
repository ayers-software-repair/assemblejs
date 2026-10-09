// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** One attribute of a scanned start tag: its lower-case name and its source, exactly as sent. */
export interface ScannedAttribute {
  readonly name: string;
  readonly source: string;
}
