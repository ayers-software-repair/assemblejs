// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { closeSync, fstatSync, openSync, readSync } from "node:fs";

/** Bound reads even if a source file grows after its size was checked. */
export function sourceBytes(file: string): Buffer {
  const descriptor = openSync(file, "r");
  try {
    const stat = fstatSync(descriptor);
    if (!stat.isFile()) throw new Error("source must be a regular file");
    if (stat.size > 65536) throw new Error("source is limited to 65536 bytes");
    const buffer = Buffer.alloc(65537);
    let used = 0;
    while (used < buffer.length) {
      const read = readSync(descriptor, buffer, used, buffer.length - used, used);
      if (read === 0) break;
      used += read;
    }
    if (used > 65536) throw new Error("source is limited to 65536 bytes");
    return buffer.subarray(0, used);
  } finally {
    closeSync(descriptor);
  }
}
