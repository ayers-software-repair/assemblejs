// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Something wrong with a project, as a structure: where, which rule, what, and what would fix it.
 *
 * A person reads the message and the fix; an agent acts on the fix and can ask why with the rule.
 * A refusal that names only what is wrong leaves the reader to guess what right looks like.
 */
export interface ProjectProblem {
  /** The file or directory at fault, relative to wherever the caller looked. */
  readonly path: string;
  /** The id of the rule it breaks, which `explain` answers. */
  readonly rule: string;
  readonly message: string;
  readonly fix: string;
}
