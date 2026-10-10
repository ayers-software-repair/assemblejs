// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AgentPrompt } from "../prompts/agent-prompt.js";
import { PROMPTS } from "../prompts/prompts.js";

const SHAPE = "lower case, a letter first, then letters, digits and hyphens";

/** A brief as the protocol carries it: one message, in the voice of the person who asked. */
const said = (prompt: AgentPrompt, given: Readonly<Record<string, string | undefined>>) => ({
  messages: [
    { role: "user" as const, content: { type: "text" as const, text: prompt.brief(given) } },
  ],
});

/**
 * The prompts, bound to the protocol: a client lists them for the person using it, and one
 * that is asked for answers its brief.
 *
 * What a person fills in becomes part of what a model reads, so nothing reaches a brief that
 * is not a name of the framework's own shape or one of a prompt's own list: the protocol
 * refuses anything else as invalid before a brief is written. A prompt that takes nothing is
 * registered as taking nothing, so a client that sends it no arguments is answered.
 */
export function registerPrompts(server: McpServer): void {
  for (const prompt of PROMPTS) {
    const shown = { title: prompt.title, description: prompt.description };
    if (prompt.arguments.length === 0) {
      server.registerPrompt(prompt.name, shown, () => said(prompt, {}));
      continue;
    }
    const argsSchema = Object.fromEntries(
      prompt.arguments.map((argument) => {
        const accepted =
          argument.accepts instanceof RegExp
            ? z.string().regex(argument.accepts, SHAPE)
            : z.enum(argument.accepts);
        // Described last: a client is shown the description of what it is given, optional or not.
        const taken = argument.required ? accepted : accepted.optional();
        return [argument.name, taken.describe(argument.description)];
      }),
    );
    server.registerPrompt(prompt.name, { ...shown, argsSchema }, (given) => said(prompt, given));
  }
}
