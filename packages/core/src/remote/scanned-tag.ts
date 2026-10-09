// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ScannedAttribute } from "./scanned-attribute.js";

/** One start tag read from a remote's answer, with where it sits in the source. */
export interface ScannedTag {
  /** The tag name, lower case, as the browser reads it. */
  readonly name: string;
  /** The offset of its `<`. */
  readonly start: number;
  /** The offset just past its `>`. */
  readonly end: number;
  readonly attributes: readonly ScannedAttribute[];
  /** Whether it ended `/>`, which closes the element only in SVG and MathML. */
  readonly selfClosing: boolean;
}
