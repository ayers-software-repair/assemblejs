// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Why a set of services cannot be ordered. Carries every problem, not the first. */
export class ServiceOrderError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`the services cannot be ordered:\n  ${problems.join("\n  ")}`);
    this.name = "ServiceOrderError";
    this.problems = problems;
  }
}
