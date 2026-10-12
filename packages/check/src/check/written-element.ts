// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ViewElement } from "./view-element.js";

/** One element an assembly's view writes, with the file it is written in. */
export interface WrittenElement {
  readonly file: string;
  readonly element: ViewElement;
}
