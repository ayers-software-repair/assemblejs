// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const OPENING = "<!-- assemblejs:instructions";

/**
 * The two comments around the part of a project's `AGENTS.md` this command line writes. `check`
 * holds what stands between them current and `add agents` rewrites it; what a project writes
 * outside them is its own. The part is found by how its first comment opens, so one an earlier
 * version wrote is found whatever that version said after it.
 */
export const INSTRUCTION_MARKERS = {
  opening: OPENING,
  begin: `${OPENING}. \`assemblejs check\` holds this part current and \`assemblejs add agents\` rewrites it. What is written outside it is this project's own. -->`,
  end: "<!-- /assemblejs:instructions -->",
} as const;
