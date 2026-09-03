// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Why the server will not start. It carries EVERY problem, not the first one: a boot failure
 * that names one variable at a time costs one restart per variable to get through.
 */
export class ConfigError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`the server cannot start:\n  ${problems.join("\n  ")}`);
    this.name = "ConfigError";
    this.problems = problems;
  }
}
