#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// One rule for a commit's header, two implementations: commitlint with config-conventional in
// the repositories that have node, and the house's shell script, check-conventional.sh, in the
// ones that do not. This repository is the one place both can run, so the two are held together
// here: every message below goes through both, and each verdict is held to what is recorded.
//
// Where the two agree, that is the rule. Where they do not, the difference is written down with
// its reason and held as well, so one that closes, or turns around, or a new one that opens at
// an upgrade of either side, is a red here and never a surprise in someone's hook.
//
// The house's script is a byte-copy, with the two files it sources, of platform/codestyle at a
// named tag, held to their hashes: this repository is public and its CI checks nothing out with
// a credential. Re-syncing is copying the three files and recording their hashes and the tag.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const HOUSE = {
  tag: "v0.54.4",
  directory: "scripts/house",
  files: {
    "check-conventional.sh": "c1553d0eb8b17aacead61eaadd5733734dd6352c344b61e4bc0892959127c4a1",
    "gates_range.sh": "c49e18b2b53fe1bb7fe0924954d40dd1dc422f9e082480681b90ffd224262dae",
    "codestyle_key.sh": "43dfa71cc806bcbab4d6200b627f52c8d6c9b10fdf77f58b1a527825bfdb0c93",
  },
};

const PASS = true;
const FAIL = false;
const rule = (message, verdict) => ({ message, commitlint: verdict, house: verdict });
const differs = (message, commitlint, house, why) => ({ message, commitlint, house, why });
const LONG = "x".repeat(101);

/** Every message both implementations judge, with the verdict recorded for each. */
export const FIXTURES = [
  // The house's own cross-test fixtures, as its script lists them.
  rule("feat: add the pack consent step", PASS),
  rule("fix(console): repoint the drift pin", PASS),
  rule("refactor!: drop the legacy reader", PASS),
  rule("docs: note the pin", PASS),
  rule("chore(deps): bump the thing", PASS),
  rule("perf: speed up the scan", PASS),
  rule("Added the thing", FAIL),
  rule("feat: Add the thing", FAIL),
  rule("feat: add a thing.", FAIL),
  rule("wip: something", FAIL),
  rule("feat add the thing", FAIL),
  rule("FEAT: add the thing", FAIL),
  // The edges of the same rule.
  rule("feat(core)!: drop the reader", PASS),
  rule("feat(Core): add the thing", PASS),
  rule("feat: add the API", PASS),
  rule("feat: API changes", FAIL),
  rule("feat:add the thing", FAIL),
  rule("feat: ", FAIL),
  rule(" feat: add the thing", FAIL),
  rule(`feat: ${"y".repeat(94)}`, PASS),
  rule(`feat: ${"y".repeat(95)}`, FAIL),
  rule('Revert "feat: add the thing"', PASS),
  rule("revert: feat: add the thing", PASS),
  rule("chore(release): 1.0.0", PASS),
  rule("Initial commit", FAIL),
  // Where the two part ways today, each with the reason.
  differs("feat(): add the thing", PASS, FAIL, "commitlint takes an empty scope as no scope"),
  differs(
    "feat: add the thing ",
    FAIL,
    PASS,
    "commitlint's header-trim; the script allows a trailing space",
  ),
  differs(
    "Merge branch 'main' into next",
    PASS,
    FAIL,
    "commitlint ignores a merge; the script skips one in a range and judges it in a hook",
  ),
  differs(
    "fixup! feat: add the thing",
    PASS,
    FAIL,
    "commitlint ignores fixup!, squash! and amend!",
  ),
  differs("1.0.0", PASS, FAIL, "commitlint ignores a message that is a version alone"),
  differs(
    "Revert fix: the thing",
    PASS,
    FAIL,
    "commitlint ignores every message that begins Revert; the script takes git's own quoted form alone",
  ),
  differs(
    `feat: add the thing\n\n${LONG}`,
    FAIL,
    PASS,
    "commitlint's body-max-line-length; the script reads the header alone",
  ),
  differs(
    `feat: add the thing\n\nbody\n\nRefs: ${LONG}`,
    FAIL,
    PASS,
    "commitlint's footer-max-line-length; the script reads the header alone",
  ),
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
    // An edited copy of the house's script; a verdict of the rule that moved; a recorded
    // difference that closed, and one that turned around: each refused, and the record clean.
    const recorded = (side) => async (message) =>
      FIXTURES.find((fixture) => fixture.message === message)?.[side] ?? false;
    const flipped = (side, which) => async (message) =>
      (await recorded(side)(message)) !== (message === which);
    const edited = houseDrift((file) => `${readFileSync(file, "utf8")}\n# edited`);
    const moved = await verdictProblems(
      FIXTURES,
      flipped("commitlint", "wip: something"),
      recorded("house"),
    );
    const closed = await verdictProblems(
      FIXTURES,
      flipped("commitlint", "1.0.0"),
      recorded("house"),
    );
    const turned = await verdictProblems(
      FIXTURES,
      flipped("commitlint", "1.0.0"),
      flipped("house", "1.0.0"),
    );
    const clean = await verdictProblems(FIXTURES, recorded("commitlint"), recorded("house"));
    const red =
      edited.length === Object.keys(HOUSE.files).length &&
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
      "commit rule self-test: red on an edited copy of the house's script, a verdict of the rule that moved, a difference that closed and one that turned around, as required",
    );
    process.exit(0);
  }

  const problems = houseDrift((file) => readFileSync(file));
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
  console.log(
    `commit rule: commitlint and the house script at ${HOUSE.tag} give the recorded verdict on ${String(FIXTURES.length)} messages, ${String(FIXTURES.length - apart)} the same and ${String(apart)} recorded as different`,
  );
}
