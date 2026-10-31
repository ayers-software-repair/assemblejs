// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { RENDERERS } from "@asmjs/build";
import { describe, expect, it } from "vitest";
import {
  AGENT_SERVER,
  INSTRUCTION_MARKERS,
  MCP_REGISTRATIONS,
  RULES,
  agentInstructions,
} from "@asmjs/check";

describe("what an agent that opens a project is told", () => {
  const told = agentInstructions();
  // What reaches an agent whose client strips comments from an instruction file, as Claude Code does.
  const visible = told.replace(/<!--[\s\S]*?-->/g, "");

  it("stands between the two comments check finds it by", () => {
    expect(told.startsWith(INSTRUCTION_MARKERS.begin)).toBe(true);
    expect(told.endsWith(INSTRUCTION_MARKERS.end)).toBe(true);
  });

  it("opens with where a model reads the documentation of the channel that wrote it", () => {
    const { version } = JSON.parse(
      readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"),
    ) as { version: string };
    const docs = version.includes("-") ? "https://assemblejs.com/next/" : "https://assemblejs.com/";
    expect(
      visible
        .trimStart()
        .startsWith(
          `The documentation a model can read is at ${docs}llms.txt, and its full text at ${docs}llms-full.txt.`,
        ),
    ).toBe(true);
  });

  it("says what a page, an assembly, a placement, a service and an api are", () => {
    for (const word of ["**page**", "**assembly**", "**places**", "**service**", "**api**"]) {
      expect(visible, word).toContain(word);
    }
    expect(visible).toContain('`<assembly name="cart"></assembly>`');
    expect(visible).toContain("`src/server.ts` never");
  });

  it("says how a service says not found, and what the not-found page is", () => {
    expect(visible).toContain("throws\n  `new NotFound()`, from `@asmjs/core`");
    expect(visible).toContain("A page named `not-found` has no route");
  });

  it("says how an assembly's browser half reaches its own server's apis", () => {
    expect(visible).toContain('`fetch(api("/api/..."))`');
    expect(visible).toContain("`@asmjs/core/client`");
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
      "`assemblejs://contract`",
      "`add_assembly`",
      "`plan_assembly`",
      "`apply_assembly_plan`",
      "`discard_assembly_plan`",
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

  // The composer reads what a view rendered, whoever wrote it (DESIGN 7).
  it("says that data is written escaped, and what a directive in a value written raw does", () => {
    expect(visible).toContain(
      "A view writes that data escaped, as every renderer does by default.",
    );
    expect(visible).toContain("an `<assembly>` in it is placed like one the view wrote");
    expect(visible).toContain("so nothing a visitor sent is written raw.");
  });

  // An agent told that it will be shown a view, and shown a refusal, has been told wrong.
  it("says which views the tools show with the dev server running, and which with none", () => {
    expect(visible).toContain(
      "While the project's dev server runs\n  (`npx assemblejs dev`), both ask it, so any view is shown as the project serves it",
    );
    expect(visible).toContain(
      "With none running, a plain html view is rendered on the spot and a\n  view in a framework or a template language is answered with the reason",
    );
  });

  it("says what perf weighs, in two parts, and where a page with a parameter gets its address", () => {
    expect(visible).toContain(
      "`npx assemblejs perf` weighs what each page sends before anything mounts and as its\n  assemblies mount, held to `budgets`; a page with a parameter is weighed at its entry in `addresses`.",
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
