// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { isAbsolute, join, relative, sep } from "node:path";
import type { Io } from "../io/io.js";

/**
 * An io that writes what is addressed beneath one directory beneath another instead, and
 * everything else where it is addressed. A build's writers address the build's output, `dist`;
 * handed this, they write a build that stands beside the one being served until it is whole.
 */
export function stagedIo(io: Io, from: string, to: string): Io {
  const staged = (path: string): string => {
    const within = relative(from, path);
    return within === ".." || within.startsWith(`..${sep}`) || isAbsolute(within)
      ? path
      : join(to, within);
  };
  return {
    ...io,
    write: (path, contents) => io.write(staged(path), contents),
    exists: (path) => io.exists(staged(path)),
    remove: (path) => io.remove(staged(path)),
  };
}
