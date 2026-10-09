// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** A remote assembly's content endpoint, taken apart: where it is and what it is. */
export interface ContentUrl {
  readonly origin: string;
  readonly name: string;
  readonly view: string;
  /** The content endpoint itself, exactly as declared. */
  readonly content: string;
  /** The same assembly's manifest endpoint. */
  readonly manifest: string;
}
