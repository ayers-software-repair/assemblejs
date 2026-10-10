// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

const beneath = (step: string): boolean =>
  step !== "" && step !== ".." && !step.startsWith(`..${sep}`) && !isAbsolute(step);

/**
 * Whether a file lies inside a directory: by how its path is written first, so that one written
 * outside is never looked for, and then by where it really leads, every link in either path
 * followed. A file that is not there, written inside, is inside. A stylesheet's references are
 * copied into the public build, so one that leads out of its assembly's directory, by `../` or
 * by a link, would publish whatever file it names.
 */
export function insideDirectory(directory: string, file: string): boolean {
  if (!beneath(relative(resolve(directory), resolve(file)))) return false;
  let real: string;
  try {
    real = realpathSync(file);
  } catch {
    return true;
  }
  return beneath(relative(realpathSync(directory), real));
}
