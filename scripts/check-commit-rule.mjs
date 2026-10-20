#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// One rule for a commit's message, two implementations: commitlint under the house's config in
// the repositories that have node, and the house's shell script, check-conventional.sh, in the
// ones that do not. This repository is the one place both can run, so the two are held together
// here: every message below goes through both, and each verdict is held to what is recorded.
//
// The house settled the rule with one verdict for every message, so no difference between the
// two is recorded. One that opens at an upgrade of either side is a red here, and a finding for
// the house's kit, never a surprise in someone's hook. Until the kit answers it, it can be
// written down as a difference, with its reason, and is then held as well: one that closes or
// turns around is a red too.
//
// The house's script, the two files it sources and its commitlint config are byte-copies of
// platform/codestyle at a named tag, held to their hashes: this repository is public and its CI
// checks nothing out with a credential. The root commitlint.config.mjs re-exports the copied
// config, so the hook and CI judge by it. Re-syncing is copying the four files and recording
// their hashes and the tag, which is the product's one platform pin: a tag that is not the pin
// is refused.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { offThePin } from "./platform-pin.mjs";

export const HOUSE = {
  tag: "v0.70.0",
  directory: "scripts/house",
  files: {
    "check-conventional.sh": "e5a1139167d832dc8eecc00a50732f252c21a14799f77618c6160a0d8cee1258",
    "commitlint.config.mjs": "8fda08245d3460ba40bbf9cf22a9bc6a46d020dbc6784580232127e3cc303848",
    "gates_range.sh": "c49e18b2b53fe1bb7fe0924954d40dd1dc422f9e082480681b90ffd224262dae",
    "codestyle_key.sh": "43dfa71cc806bcbab4d6200b627f52c8d6c9b10fdf77f58b1a527825bfdb0c93",
  },
};

const PASS = true;
const FAIL = false;
const rule = (message, verdict) => ({ message, commitlint: verdict, house: verdict });
const differs = (message, commitlint, house, why) => ({ message, commitlint, house, why });
const LONG = "x".repeat(101);
const SCISSORS = "# ------------------------ >8 ------------------------";

/** Every message both implementations judge, with the verdict recorded for each. */
export const FIXTURES = [
  // The house script's own fixtures, as its self-test lists them: first the ones it accepts.
  rule("feat: add the pack consent step", PASS),
  rule("fix(console): repoint the drift pin", PASS),
  rule("refactor!: drop the legacy reader", PASS),
  rule("docs: note the pin", PASS),
  rule('Revert "fix: switch profile matches back\'s letter spacing"', PASS),
  rule('Reapply "fix: the thing"', PASS),
  rule("Merge branch 'main' into next", PASS),
  rule("Merge tag 'v1.0.0'", PASS),
  rule("Merge remote-tracking branch 'origin/main'", PASS),
  rule("Merge pull request #7 from a/b", PASS),
  rule("fixup! feat: add the thing", PASS),
  rule("squash! feat: add the thing", PASS),
  rule("amend! feat: add the thing", PASS),
  rule("feat: add the thing\n\nA body line.\n\nRefs: #7", PASS),
  rule(`feat: add the thing\n\nSee https://example.test/${LONG} for the whole of it.`, PASS),
  rule(`feat: add the thing\n\n# ${LONG}\nA body line.`, PASS),
  rule(`feat: add the thing\n\nA body line.\n${SCISSORS}\ndiff --git ${LONG}`, PASS),
  rule(`Merge branch 'side'\n\n${LONG}`, PASS),
  // Then the ones it refuses.
  rule("Added the thing", FAIL),
  rule("feat: Add the thing", FAIL),
  rule("feat: add a thing.", FAIL),
  rule("wip: something", FAIL),
  rule("feat add the thing", FAIL),
  rule("Reverted the thing", FAIL),
  rule("Revert fix: the thing", FAIL),
  rule("1.0.0", FAIL),
  rule("feat(): add the thing", FAIL),
  rule("feat( ): add the thing", FAIL),
  rule("feat: add the thing ", FAIL),
  rule(" feat: add the thing", FAIL),
  rule("Merged in the side branch", FAIL),
  rule(`feat: ${LONG}`, FAIL),
  rule(`feat: add the thing\n\n${LONG}`, FAIL),
  rule(`feat: add the thing\n\nA body line.\n\nRefs: ${LONG}`, FAIL),
  // The edges of the same rule.
  rule("chore(deps): bump the thing", PASS),
  rule("perf: speed up the scan", PASS),
  rule("FEAT: add the thing", FAIL),
  rule("feat(core)!: drop the reader", PASS),
  rule("feat(Core): add the thing", PASS),
  rule("feat: add the API", PASS),
  rule("feat: API changes", FAIL),
  rule("feat:add the thing", FAIL),
  rule("feat: ", FAIL),
  rule(`feat: ${"y".repeat(94)}`, PASS),
  rule(`feat: ${"y".repeat(95)}`, FAIL),
  rule(`feat: add the thing\n\n${"z".repeat(100)}`, PASS),
  rule(`feat: add the thing\n\nRefs: https://example.test/${LONG}`, PASS),
  rule('Revert "feat: add the thing"', PASS),
  rule("revert: feat: add the thing", PASS),
  rule("chore(release): 1.0.0", PASS),
  rule("Initial commit", FAIL),
];

const said = (verdict) => (verdict ? "passes" : "refuses");
const shown = (message) =>
  JSON.stringify(message.length > 60 ? `${message.slice(0, 57)}...` : message);

/** Each of the house's files that is not the byte-copy recorded, one line each. */
export function houseDrift(read) {
  const problems = [];
  for (const [name, sha256] of Object.entries(HOUSE.files)) {
    const found = createHash("sha256")
      .update(read(join(HOUSE.directory, name)))
      .digest("hex");
    if (found !== sha256) {
      problems.push(
        `${HOUSE.directory}/${name} is not platform/codestyle's at ${HOUSE.tag} (sha256 ${found.slice(0, 12)}, expected ${sha256.slice(0, 12)}): copy it again, or record the new hash and tag`,
      );
    }
  }
  return problems;
}

/** Each fixture whose verdicts are not the ones recorded, one line each. */
export async function verdictProblems(fixtures, commitlint, house) {
  const problems = [];
  // A few at a time: each verdict is a process, and thirty at once would be thirty nodes.
  for (let at = 0; at < fixtures.length; at += 8) {
    const batch = fixtures.slice(at, at + 8);
    const verdicts = await Promise.all(
      batch.map(async (fixture) => [
        await commitlint(fixture.message),
        await house(fixture.message),
      ]),
    );
    batch.forEach((fixture, index) => {
      const [lint, shell] = verdicts[index];
      if (lint === fixture.commitlint && shell === fixture.house) return;
      const now = `commitlint ${said(lint)} and the house script ${said(shell)}`;
      if (fixture.commitlint === fixture.house) {
        problems.push(`${shown(fixture.message)}: the rule ${said(fixture.commitlint)} it; ${now}`);
      } else if (lint === shell) {
        problems.push(
          `${shown(fixture.message)} was a recorded difference and ${now}: it is the rule now, so record it as one`,
        );
      } else {
        problems.push(
          `${shown(fixture.message)}: the recorded difference has turned around; ${now}`,
        );
      }
    });
  }
  return problems;
}

const exits = (command, args, input) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["pipe", "ignore", "ignore"] });
    child.on("error", () => resolve(undefined));
    child.on("close", (code) => resolve(code));
    child.stdin.end(input);
  });

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    // An edited copy of each of the house's files; a verdict of the rule that moved; and, on a
    // difference made up here because none is recorded, one that closed and one that turned
    // around: each refused, and the record clean.
    const apart = "docs: the two part on this one";
    const held = [
      ...FIXTURES,
      differs(apart, PASS, FAIL, "made up, to prove a difference is held"),
    ];
    const recorded = (side) => async (message) =>
      held.find((fixture) => fixture.message === message)?.[side] ?? false;
    const flipped = (side, which) => async (message) =>
      (await recorded(side)(message)) !== (message === which);
    const edited = houseDrift((file) => `${readFileSync(file, "utf8")}\n# edited`);
    const moved = await verdictProblems(
      held,
      flipped("commitlint", "wip: something"),
      recorded("house"),
    );
    const closed = await verdictProblems(held, flipped("commitlint", apart), recorded("house"));
    const turned = await verdictProblems(
      held,
      flipped("commitlint", apart),
      flipped("house", apart),
    );
    const clean = await verdictProblems(held, recorded("commitlint"), recorded("house"));
    const unpinned = offThePin("the house's commit rule", HOUSE.tag, "v0.0.0");
    const red =
      edited.length === Object.keys(HOUSE.files).length &&
      unpinned.length === 1 &&
      offThePin("the house's commit rule", HOUSE.tag, HOUSE.tag).length === 0 &&
      moved.length === 1 &&
      moved[0].includes("the rule refuses it") &&
      closed.length === 1 &&
      closed[0].includes("it is the rule now") &&
      turned.length === 1 &&
      turned[0].includes("turned around");
    if (!red || clean.length > 0 || houseDrift((file) => readFileSync(file)).length > 0) {
      console.error("commit rule self-test: FAILED");
      for (const line of [...edited, ...moved, ...closed, ...turned, ...clean])
        console.error(`  ${line}`);
      process.exit(1);
    }
    console.log(
      "commit rule self-test: red on an edited copy of each of the house's files, a tag that is not the pin, a verdict of the rule that moved, a difference that closed and one that turned around, as required",
    );
    process.exit(0);
  }

  const problems = [
    ...houseDrift((file) => readFileSync(file)),
    ...offThePin("the house's commit rule", HOUSE.tag),
  ];
  const scratch = mkdtempSync(join(tmpdir(), "commit-rule-"));
  let written = 0;
  const commitlint = async (message) =>
    (await exits("node_modules/.bin/commitlint", [], `${message}\n`)) === 0;
  const house = async (message) => {
    const file = join(scratch, `message-${String((written += 1))}`);
    writeFileSync(file, `${message}\n`);
    const script = join(HOUSE.directory, "check-conventional.sh");
    return (await exits("bash", [script, "--message", file], "")) === 0;
  };
  try {
    // Either one failing to start reads as a refusal of everything, so each is asked first for
    // the one message nothing refuses.
    const plain = "feat: add the pack consent step";
    if (!(await commitlint(plain)))
      problems.push("commitlint did not run, or refuses a plain header");
    if (!(await house(plain)))
      problems.push("the house script did not run, or refuses a plain header");
    if (problems.length === 0)
      problems.push(...(await verdictProblems(FIXTURES, commitlint, house)));
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  for (const problem of problems) console.error(`commit rule: ${problem}`);
  if (problems.length > 0) process.exit(1);
  const apart = FIXTURES.filter((fixture) => fixture.commitlint !== fixture.house).length;
  const count = String(FIXTURES.length);
  console.log(
    apart === 0
      ? `commit rule: commitlint under the house's config and the house script, both at ${HOUSE.tag}, give one verdict on each of ${count} messages, the one recorded`
      : `commit rule: commitlint and the house script at ${HOUSE.tag} give the recorded verdict on ${count} messages, ${String(FIXTURES.length - apart)} the same and ${String(apart)} recorded as different`,
  );
}
