// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import {
  AGENT_SERVER,
  INSTRUCTION_MARKERS,
  MCP_REGISTRATIONS,
  RENDERERS,
  RULES,
  agentInstructions,
} from "@assemblejs/cli";

describe("what an agent that opens a project is told", () => {
  const told = agentInstructions();
  // What reaches an agent whose client strips comments from an instruction file, as Claude Code does.
  const visible = told.replace(/<!--[\s\S]*?-->/g, "");

  it("stands between the two comments check finds it by", () => {
    expect(told.startsWith(INSTRUCTION_MARKERS.begin)).toBe(true);
    expect(told.endsWith(INSTRUCTION_MARKERS.end)).toBe(true);
  });

  it("says what a page, an assembly, a placement, a service and an api are", () => {
    for (const word of ["**page**", "**assembly**", "**places**", "**service**", "**api**"]) {
      expect(visible, word).toContain(word);
    }
    expect(visible).toContain('`<assembly name="cart"></assembly>`');
    expect(visible).toContain("`src/server.ts` never");
  });

  it("names the agent surface, where it is registered, and how to start it where it is not", () => {
    expect(visible).toContain(`Its MCP server, \`${AGENT_SERVER.name}\`, is registered in`);
    for (const registration of MCP_REGISTRATIONS) {
      expect(visible, registration.path).toContain(`\`${registration.path}\``);
    }
    expect(visible).toContain(`\`node ${AGENT_SERVER.path}\``);
  });

  it("names what to read, the tools that change the project, and the ones that show the result", () => {
    for (const named of [
      "`assemblejs://project`",
      "`assemblejs://rules`",
      "`add_assembly`",
      "`place_assembly`",
      "`render_assembly`",
      "`compose_page`",
      "`check`",
      "`explain`",
      "`npx assemblejs check`",
      "`npx assemblejs add assembly <name> --renderer <renderer>`",
    ]) {
      expect(visible, named).toContain(named);
    }
  });

  // An agent told that it will be shown a view, and shown a refusal, has been told wrong.
  it("says which views the tools show at once, and where the rest are seen", () => {
    expect(visible).toContain(
      "A view in a framework or a template language is source its renderer\n  compiles, so both tools say that in place of showing it, and the running server shows it.",
    );
  });

  // One list: a rule or a renderer added to the framework is in every project's instructions.
  it("carries every rule the agent surface explains, and every renderer the command scaffolds", () => {
    const unmarked = visible.replaceAll("`", "");
    for (const rule of RULES) expect(unmarked).toContain(`- ${rule.id}: ${rule.rule}\n`);
    expect(visible).toContain(`  ${RENDERERS.join(", ")}.`);
  });

  // A Markdown reader takes a word in angle brackets for a tag and shows nothing of it.
  it("writes as code whatever a rule's sentence holds in angle brackets", () => {
    expect(visible).toContain(
      "- `a-directory-is-a-page`: A directory under src/pages IS a page: `<name>/<name>.html` is the page at `/<name>`, home at /.",
    );
    expect(visible).toContain(
      'Every `<assembly name="..."></assembly>` in a page template names an assembly',
    );
    expect(visible).toContain("A file `src/api/<name>.api.ts` default-exports one api");
    expect(visible).toContain("and its components' `<style>`, scoped to it");
    expect(visible.replace(/`[^`\n]*`/g, "")).not.toMatch(/[<>]/);
  });

  // The comment that says so is one an agent may never be shown.
  it("says in its own text who keeps this part of the file, and where a project's own goes", () => {
    expect(visible).toContain("written by `npx assemblejs add agents` and held current by `check`");
    expect(visible).toContain("Put this project's own instructions outside it.");
  });

  // Claude Code reads an `@` and a path written anywhere else as a file to import.
  it("writes every @ inside a code span", () => {
    expect(visible).toContain("@");
    expect(visible.replace(/`[^`\n]*`/g, "")).not.toContain("@");
  });

  it("is the same for every project and every call, so it is current or it is not", () => {
    expect(agentInstructions()).toBe(told);
    expect(told).not.toMatch(/\d+\.\d+\.\d+/);
  });
});
