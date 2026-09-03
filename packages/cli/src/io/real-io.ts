// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Io } from "./io.js";

/* eslint-disable no-console */
/** The io a command gets when it is actually run. */
export const realIo: Io = {
  write: (path, contents) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents);
  },
  exists: (path) => existsSync(path),
  log: (line) => console.log(line),
  error: (line) => console.error(line),
};
