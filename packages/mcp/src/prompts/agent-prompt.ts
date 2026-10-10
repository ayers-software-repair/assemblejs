// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * One thing a person asks an agent for, as the framework would brief the agent to do it.
 *
 * A prompt is the person's to pick, by name, from the list the protocol gives their client.
 * What it answers is the brief: one message, in the person's voice, that names each tool to
 * call, what to read in its answer, and where to stop and ask.
 */
export interface AgentPrompt {
  readonly name: string;
  /** What a client shows for it. */
  readonly title: string;
  readonly description: string;
  /** What the person fills in, in the order a client asks for them. */
  readonly arguments: readonly {
    readonly name: string;
    readonly description: string;
    readonly required: boolean;
    /** What it may be: one of these, or anything of this shape. Nothing else is briefed. */
    readonly accepts: readonly string[] | RegExp;
  }[];
  /** The brief, for what was filled in. */
  brief(given: Readonly<Record<string, string | undefined>>): string;
}
