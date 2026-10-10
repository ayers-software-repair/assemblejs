// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { agentInstructions, instructionsIn } from "@assemblejs/cli";

describe("the part of an AGENTS.md the command line wrote", () => {
  it("is found with its two comments, and where it stands, whatever is written around it", () => {
    const file = `# shop\n\nOur own notes.\n\n${agentInstructions()}\n\n## Deploys\n\nOn Fridays.\n`;
    const found = instructionsIn(file);
    expect(found?.text).toBe(agentInstructions());
    expect(file.slice(0, found?.start)).toBe("# shop\n\nOur own notes.\n\n");
    expect(file.slice(found?.end)).toBe("\n\n## Deploys\n\nOn Fridays.\n");
  });

  // An earlier version's opening comment said something else after its first words.
  it("is found by how its first comment opens, so an earlier version's part is found too", () => {
    const earlier =
      "<!-- assemblejs:instructions, as an earlier version wrote them -->\nold\n<!-- /assemblejs:instructions -->";
    expect(instructionsIn(`# shop\n\n${earlier}\n`)?.text).toBe(earlier);
  });

  // A checkout may end every line with a carriage return and a line feed.
  it("is given with its lines ended as the command line ends them, wherever it stands", () => {
    const file = `# shop\n\n${agentInstructions()}\n\nOurs.\n`.replaceAll("\n", "\r\n");
    const found = instructionsIn(file);
    expect(found?.text).toBe(agentInstructions());
    expect(file.slice(0, found?.start)).toBe("# shop\r\n\r\n");
    expect(file.slice(found?.end)).toBe("\r\n\r\nOurs.\r\n");
  });

  it("is nothing in a file that carries none, or that never closes one", () => {
    expect(instructionsIn("# shop\n\nOur own notes.\n")).toBeUndefined();
    expect(instructionsIn("<!-- assemblejs:instructions. cut short")).toBeUndefined();
    expect(instructionsIn("<!-- /assemblejs:instructions -->\n\nonly an ending")).toBeUndefined();
    expect(instructionsIn("")).toBeUndefined();
  });
});
