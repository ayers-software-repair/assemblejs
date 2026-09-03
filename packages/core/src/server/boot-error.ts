// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Why a server will not be built. Carries every problem, not the first. */
export class BootError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`the server cannot be built:\n  ${problems.join("\n  ")}`);
    this.name = "BootError";
    this.problems = problems;
  }
}
