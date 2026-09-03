// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * One constraint real code must satisfy, with the reason it exists.
 *
 * The reason is not decoration. An agent that knows only the rule complies with it; an agent
 * that knows why can tell when it is looking at the situation the rule was written for, and
 * can say so to the person it is working with.
 */
export interface Rule {
  readonly id: string;
  /** The rule, as one sentence a reader can check code against. */
  readonly rule: string;
  /** Why it exists, in terms of what goes wrong without it. */
  readonly because: string;
  /** What it looks like when it is broken. */
  readonly smell: string;
}
