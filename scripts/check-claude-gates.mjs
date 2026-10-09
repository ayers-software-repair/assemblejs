#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// CLAUDE.md's gate paragraph names the scripts that enforce the organization rules and says
// that a gate named there and absent from the `check` chain is a false claim. This is the check
// behind that sentence: every gate the paragraph names, in backticks, must be a step of
// package.json's `check` script. The first version of that paragraph was wrong, and a claim no
// script reads goes wrong again the next time a gate is renamed.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const PARAGRAPH_START = "Enforced, and every one of these is a script in `pnpm check`";
const GATE = /`((?:check:[a-z-]+)|lint|typecheck|build|test)`/g;

/** The gates the paragraph names, in order, each once. */
export function namedGates(claudeMd) {
  const start = claudeMd.indexOf(PARAGRAPH_START);
  if (start < 0) return undefined;
  const end = claudeMd.indexOf("\n\n", start);
  const paragraph = claudeMd.slice(start, end < 0 ? undefined : end);
  return [...new Set([...paragraph.matchAll(GATE)].map((match) => match[1]))];
}

/** The steps of the `check` chain: each `pnpm <name>` joined by `&&`. */
export function chainGates(packageJson) {
  const chain = JSON.parse(packageJson).scripts?.check ?? "";
  return chain
    .split("&&")
    .map((step) => step.trim())
    .filter((step) => step.startsWith("pnpm "))
    .map((step) => step.slice("pnpm ".length).trim());
}

/** Every gate the paragraph names that the chain does not run, one line each. */
export function problemsOf(claudeMd, packageJson) {
  const named = namedGates(claudeMd);
  if (named === undefined) return ["CLAUDE.md has no gate paragraph to check"];
  const chain = new Set(chainGates(packageJson));
  return named
    .filter((gate) => !chain.has(gate))
    .map(
      (gate) =>
        `CLAUDE.md names \`${gate}\` as a gate and package.json's check chain does not run it`,
    );
}

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    // A gate the chain lacks, named as `check:*` and as a bare verb, is refused; one named in
    // the paragraph after is not read; a file with no paragraph is refused.
    const good = '{"scripts":{"check":"pnpm check:a && pnpm lint && pnpm build"}}';
    const claims = `${PARAGRAPH_START}:\n\`check:a\` (one), \`lint\` (two), \`check:gone\` (three), \`test\` (four).\n\nThe next paragraph names \`check:elsewhere\`, which is not a claim of the list.`;
    const seen = problemsOf(claims, good);
    const missingParagraph = problemsOf("no paragraph here", good);
    if (
      seen.length !== 2 ||
      !seen[0].includes("`check:gone`") ||
      !seen[1].includes("`test`") ||
      problemsOf(claims.replace("`check:gone` (three), `test` (four).", ""), good).length !== 0 ||
      missingParagraph.length !== 1
    ) {
      console.error("claude gates self-test: FAILED to refuse a gate the chain does not run");
      for (const line of seen) console.error(`  saw: ${line}`);
      process.exit(1);
    }
    console.log("claude gates self-test: red on a named gate the chain does not run, as required");
    process.exit(0);
  }
  const problems = problemsOf(
    readFileSync("CLAUDE.md", "utf8"),
    readFileSync("package.json", "utf8"),
  );
  if (problems.length > 0) {
    console.error(`claude gates: ${problems.length} false claim(s):`);
    for (const line of problems) console.error(`  ${line}`);
    process.exit(1);
  }
  const named = namedGates(readFileSync("CLAUDE.md", "utf8"));
  console.log(`claude gates: every gate CLAUDE.md names (${named.length}) is in the check chain`);
}
