// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readDefaultExport } from "../check/read-default-export.js";
import { UNWRITTEN } from "../check/unwritten.js";
import { fromRoot } from "../discovery/from-root.js";
import { readInside } from "../root/read-inside.js";
import type { ApiShape } from "./api-shape.js";
import { COMPUTED } from "./computed.js";
import { fieldAsWritten } from "./field-as-written.js";
import { fieldsOf } from "./fields-of.js";
import { UNREAD } from "./unread.js";

/**
 * One api file's route as it is written, read and never run: its path, its method, GET where it
 * names none, and whether it streams, which is whether it declares `stream`. What the file
 * computes is marked, and so is all of it for a file that cannot be read, or that leads out of
 * the project and is not opened.
 */
export function readApiShape(root: string, file: string): ApiShape {
  const shown = { file: fromRoot(root, file) };
  let declared;
  try {
    declared = fieldsOf(readDefaultExport(readInside(root, file)));
  } catch {
    return { ...shown, path: UNREAD, method: UNREAD, streams: UNREAD };
  }
  if (declared === undefined) {
    return { ...shown, path: COMPUTED, method: COMPUTED, streams: COMPUTED };
  }
  return {
    ...shown,
    path: fieldAsWritten(declared, "path", null),
    method: fieldAsWritten(declared, "method", "GET"),
    streams: "stream" in declared ? true : UNWRITTEN in declared ? COMPUTED : false,
  };
}
