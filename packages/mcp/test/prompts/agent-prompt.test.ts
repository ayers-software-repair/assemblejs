// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import type { AgentPrompt } from "@assemblejs/mcp";

describe("one thing a person asks an agent for", () => {
  it("is a name to pick it by, what a client shows, what is filled in, and the brief", () => {
    const prompt: AgentPrompt = {
      name: "greet",
      title: "Greet someone",
      description: "Says hello to a named assembly.",
      arguments: [
        { name: "who", description: "the assembly", required: true, accepts: /^[a-z]+$/ },
      ],
      brief: ({ who = "" }) => `Greet "${who}".`,
    };
    expect(Object.keys(prompt).sort()).toEqual([
      "arguments",
      "brief",
      "description",
      "name",
      "title",
    ]);
    expect(prompt.brief({ who: "cart" })).toBe('Greet "cart".');
  });
});
