// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describeFailure } from "./describe-failure.js";
import type { LogLine } from "./log-line.js";
import { newCorrelationId } from "./new-correlation-id.js";

const installed = new WeakSet<object>();

/**
 * Logs a rejection nothing handled, or an exception nothing caught, against a correlation id,
 * and ends the process: one in a state nothing accounted for is worse than one restarted by its
 * supervisor. Installed once per process, however many servers in it listen.
 */
export function exitOnUnhandled(
  target: {
    on(event: "unhandledRejection" | "uncaughtException", listener: (cause: unknown) => void): void;
  },
  log: (line: LogLine) => void,
  exit: (code: number) => void,
): void {
  if (installed.has(target)) return;
  installed.add(target);
  const fail = (cause: unknown): void => {
    log(describeFailure(newCorrelationId(), cause));
    exit(1);
  };
  target.on("unhandledRejection", fail);
  target.on("uncaughtException", fail);
}
