// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { LimitsConfig } from "../config/limits-config.js";

/**
 * Everything wrong with the limits a project set, found before anything listens: a depth that
 * is not a whole number, and a count of placements that is not a whole number of at least
 * one, since a server allowed to compose nothing is a mistake and not a policy.
 */
export function limitProblems(limits: LimitsConfig | undefined): readonly string[] {
  const problems: string[] = [];
  if (limits === undefined) return problems;
  if (limits.depth !== undefined && (!Number.isInteger(limits.depth) || limits.depth < 0)) {
    problems.push(
      `limits.depth is ${String(limits.depth)}, and must be a whole number of zero or more`,
    );
  }
  if (
    limits.placements !== undefined &&
    (!Number.isInteger(limits.placements) || limits.placements < 1)
  ) {
    problems.push(
      `limits.placements is ${String(limits.placements)}, and must be a whole number of one or more`,
    );
  }
  return problems;
}
