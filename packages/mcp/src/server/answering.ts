// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { resolve } from "node:path";
import { OutsideRootError, outsideProblems } from "@assemblejs/build";
import type { ToolResult } from "./tool-result.js";

/**
 * What a refusal that was thrown says, as the problems of an answer: a path that leads out of
 * the project or nowhere, in the words `check` uses of one, with its rule and its fix; and what
 * the system refused of a read or a write, as its own sentence. Anything else is a fault and
 * not a refusal, and is thrown on.
 */
const refused = (error: unknown): ToolResult["problems"] => {
  if (error instanceof OutsideRootError) {
    const problems = outsideProblems(error.root, [resolve(error.root, error.attempted)]);
    return problems.length > 0 ? problems : [error.message];
  }
  if (error instanceof Error && "syscall" in error && "code" in error) {
    return [`the system refused it: ${error.message}`];
  }
  throw error;
};

/**
 * A tool as the protocol calls it: what it answers carried as the one block of text a client
 * reads, the structure as JSON. Every tool is registered through here, so none answers in
 * prose. The protocol carries an error a tool throws as a line of text marked an error, which
 * an agent can only read as a sentence; a refusal is answered as any other answer is.
 */
export function answering<Arguments>(
  tool: (given: Arguments) => ToolResult | Promise<ToolResult>,
): (given: Arguments) => Promise<{ content: [{ type: "text"; text: string }] }> {
  return async (given) => {
    let answer: ToolResult;
    try {
      answer = await tool(given);
    } catch (error) {
      answer = { ok: false, result: null, problems: refused(error) };
    }
    return { content: [{ type: "text", text: JSON.stringify(answer, null, 2) }] };
  };
}
