// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The files Claude Code reads a project's instructions from, from the project's root. Where
 * either exists it is read in place of `AGENTS.md`, and so must bring `AGENTS.md` in. The first
 * is the one this command line writes.
 */
export const CLAUDE_FILES = ["CLAUDE.md", ".claude/CLAUDE.md"] as const;
