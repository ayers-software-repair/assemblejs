// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { realpathSync } from "node:fs";
import { isAbsolute, relative, sep } from "node:path";

/**
 * Whether an existing file really lies inside a directory, every link in either path followed.
 * A stylesheet's references are copied into the public build, so one that leads out of its
 * assembly's directory, by `../` or by a link, would publish whatever file it names.
 */
export function insideDirectory(directory: string, file: string): boolean {
  const step = relative(realpathSync(directory), realpathSync(file));
  return step !== "" && step !== ".." && !step.startsWith(`..${sep}`) && !isAbsolute(step);
}
