// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Folds every pending changeset into the current version's entry of each package's
// CHANGELOG.md and removes the changeset, so the first publish ships one note per package
// (owner, DECISIONS 2026-10-11, "the waiting change notes"). A changeset names its packages and
// a bump for each; the note goes under "### Minor Changes" or "### Patch Changes" of the
// version the package has now, which is the version the publish ships. It is run by hand
// before the first publish, as often as notes have gathered, and it needs nothing installed.
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const HEADING = {
  major: "### Major Changes",
  minor: "### Minor Changes",
  patch: "### Patch Changes",
};

/** A changeset's packages, each with its bump, and its note. */
export function readChangeset(text) {
  const match = /^---\n([^]*?)\n---\n([^]*)$/.exec(text);
  if (!match) throw new Error("a changeset opens with a front matter of packages and bumps");
  const bumps = [...match[1].matchAll(/^"([^"]+)":\s*(major|minor|patch)\s*$/gm)].map((m) => ({
    name: m[1],
    bump: m[2],
  }));
  if (bumps.length === 0) throw new Error("a changeset names at least one package");
  return { bumps, note: match[2].trim() };
}

/**
 * The changelog with a note folded under the given version: into that version's section for
 * the bump, made where it is missing, in the order major, minor, patch, each note one list
 * item with its later paragraphs indented as changesets writes them.
 */
export function fold(changelog, version, bump, note) {
  const head = `## ${version}`;
  const start = changelog.indexOf(`\n${head}\n`);
  if (start < 0) throw new Error(`the changelog has no section for ${version}`);
  const from = start + 1 + head.length + 1;
  const next = changelog.indexOf("\n## ", from);
  const section = changelog.slice(from, next < 0 ? undefined : next);
  const item = `- ${note.split("\n").join("\n  ")}\n`;
  const heading = HEADING[bump];
  let folded;
  if (section.includes(`${heading}\n`)) {
    const at = section.indexOf(`${heading}\n`) + heading.length + 1;
    const list = section.slice(at);
    const end = list.search(/\n### |\s*$/);
    const body = list.slice(0, end).trimEnd();
    folded = `${section.slice(0, at)}\n${body === "" ? "" : `${body}\n`}${item}${list.slice(end).replace(/^\n+/, "\n")}`;
  } else {
    // Put the heading before the first lesser one, or at the end.
    const order = ["major", "minor", "patch"];
    const lesser = order.slice(order.indexOf(bump) + 1).map((b) => `${HEADING[b]}\n`);
    const before = lesser.map((h) => section.indexOf(h)).filter((i) => i >= 0);
    const at = before.length === 0 ? section.length : Math.min(...before);
    const block = `\n${heading}\n\n${item}`;
    folded = `${section.slice(0, at).trimEnd()}\n${block}${at === section.length ? "" : `\n${section.slice(at)}`}`;
  }
  return `${changelog.slice(0, from)}${folded.replace(/\n{3,}/g, "\n\n")}${next < 0 ? "" : changelog.slice(next)}`;
}

/** Folds every changeset in `dir` into the packages under `packages`, returns what it did. */
export function foldAll(dir, packages, read, write, remove) {
  const done = [];
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()) {
    const { bumps, note } = readChangeset(read(join(dir, file)));
    for (const { name, bump } of bumps) {
      const folder = name.replace(/^@assemblejs\//, "");
      const manifest = JSON.parse(read(join(packages, folder, "package.json")));
      const changelogPath = join(packages, folder, "CHANGELOG.md");
      write(changelogPath, fold(read(changelogPath), manifest.version, bump, note));
    }
    remove(join(dir, file));
    done.push(file);
  }
  return done;
}

if (process.argv[2] === "--self-test") {
  const log =
    "# @assemblejs/core\n\n## 1.0.0-next.0\n\n### Major Changes\n\n- The first prerelease.\n";
  const one = fold(log, "1.0.0-next.0", "minor", "A minor note.\n\nIts second paragraph.");
  assert.equal(
    one,
    "# @assemblejs/core\n\n## 1.0.0-next.0\n\n### Major Changes\n\n- The first prerelease.\n\n### Minor Changes\n\n- A minor note.\n  \n  Its second paragraph.\n",
  );
  const two = fold(one, "1.0.0-next.0", "minor", "Another minor note.");
  assert.ok(
    two.includes("- A minor note.\n  \n  Its second paragraph.\n- Another minor note.\n"),
    two,
  );
  const three = fold(two, "1.0.0-next.0", "patch", "A patch note.");
  assert.ok(
    three.endsWith("- Another minor note.\n\n### Patch Changes\n\n- A patch note.\n"),
    three,
  );
  const older = `${three}\n## 0.9.0\n\n### Patch Changes\n\n- Old.\n`;
  const four = fold(older, "1.0.0-next.0", "major", "A major note.");
  assert.ok(four.includes("- The first prerelease.\n- A major note.\n\n### Minor Changes"), four);
  assert.ok(four.endsWith("\n## 0.9.0\n\n### Patch Changes\n\n- Old.\n"), four);
  assert.throws(() => fold(log, "2.0.0", "patch", "x"), /no section for 2.0.0/);
  assert.deepEqual(
    readChangeset('---\n"@assemblejs/core": minor\n"@assemblejs/cli": patch\n---\n\nThe note.\n'),
    {
      bumps: [
        { name: "@assemblejs/core", bump: "minor" },
        { name: "@assemblejs/cli", bump: "patch" },
      ],
      note: "The note.",
    },
  );
  assert.throws(() => readChangeset("no front matter"), /front matter/);
  console.log(
    "fold self-test: a note lands under its version and bump, in order, and a missing version refuses, as required",
  );
} else if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.cwd();
  const done = foldAll(
    join(root, ".changeset"),
    join(root, "packages"),
    (file) => readFileSync(file, "utf8"),
    (file, text) => writeFileSync(file, text),
    (file) => unlinkSync(file),
  );
  console.log(`folded ${String(done.length)} changeset(s): ${done.join(", ")}`);
  if (!existsSync(join(root, ".changeset", "config.json")))
    throw new Error(".changeset/config.json is gone");
}
