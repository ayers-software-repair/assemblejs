// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Written } from "./written.js";

/**
 * One api as its file says it: a route that answers data. Each value is as written, COMPUTED
 * where the file computes it, and UNREAD where the file cannot be read.
 */
export interface ApiShape {
  /** The file, from the project's root. */
  readonly file: string;
  /** The route's path; null where the file names none. */
  readonly path: Written;
  /** Its method: GET where the file names none. */
  readonly method: Written;
  /** Whether it holds its response open and streams events in place of answering once. */
  readonly streams: Written;
}
