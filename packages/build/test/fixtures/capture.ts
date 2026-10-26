// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { realIo } from "@asmjs/build";
import type { Io } from "@asmjs/build";

/** An io that keeps what a run logged and what it reported as errors, for a test to read. */
export function capture(): { io: Io; logs: string[]; errors: string[] } {
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = { ...realIo, log: (line) => logs.push(line), error: (line) => errors.push(line) };
  return { io, logs, errors };
}
