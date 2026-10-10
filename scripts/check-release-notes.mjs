#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// Holds site/release-notes.html in step with the packages' changelogs.
//
// The changelogs are changesets', one per package, in a developer's words. The page is the
// same releases for a visitor, written by hand and never generated, and the two are meant to
// say it differently. So what is checked is the structure and never the prose: one
// <section id="v<version>"> for each version any package's CHANGELOG.md heads a section with,
// exactly once, newest first, and no section for a version no changelog has. RELEASE_NOTES.md,
// the same register as the page for someone reading the repository, is headed by the newest.
//
// Without it the two drift in silence: a version is cut, the changelogs gain its heading, and
// the site goes on describing the release before. It runs in `pnpm check`, in the deploy before
// the site is published, and in the release job before a version is: it needs nothing installed.
//
// It reads version headings and no package's name. While every package heads the same versions
// that is exact. Where they part, a version one package reaches after another already has its
// section, and nothing here asks for more.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Every version a changelog heads a section with. */
export const changelogVersions = (text) => [...text.matchAll(/^##\s+(\S+)/gm)].map((m) => m[1]);

/** Every version the page has a section for, in the page's order. */
export const pageSections = (html) =>
  [...html.matchAll(/<section\s+id="v([^"]+)"/g)].map((m) => m[1]);

/** Which of two versions is newer, as a sort wants it: a prerelease is older than its release. */
export function newestFirst(a, b) {
  const parts = (version) => {
    const [core, pre] = version.split(/-(.*)/s);
    return { core: core.split(".").map(Number), pre: pre === undefined ? [] : pre.split(".") };
  };
  const [one, two] = [parts(a), parts(b)];
  for (let at = 0; at < 3; at += 1) {
    if ((one.core[at] ?? 0) !== (two.core[at] ?? 0))
      return (two.core[at] ?? 0) - (one.core[at] ?? 0);
  }
  if (one.pre.length === 0 || two.pre.length === 0) return one.pre.length - two.pre.length;
  for (let at = 0; at < Math.max(one.pre.length, two.pre.length); at += 1) {
    const [x, y] = [one.pre[at], two.pre[at]];
    if (x === y) continue;
    if (x === undefined) return 1;
    if (y === undefined) return -1;
    const numeric = /^\d+$/.test(x) && /^\d+$/.test(y);
    return numeric ? Number(y) - Number(x) : x < y ? 1 : -1;
  }
  return 0;
}

/** Each way the page, the notes and the changelogs disagree in structure, as one line. */
export function problems(changelogs, pageHtml, notes) {
  const versions = [...new Set(changelogs.flatMap(changelogVersions))].sort(newestFirst);
  const sections = pageSections(pageHtml);
  if (versions.length === 0) return ['no CHANGELOG.md has a "## <version>" heading'];

  const found = [];
  for (const version of versions) {
    const count = sections.filter((section) => section === version).length;
    if (count === 0) {
      found.push(
        `a changelog has ${version} but site/release-notes.html has no <section id="v${version}">`,
      );
    }
    if (count > 1) {
      found.push(
        `site/release-notes.html has ${count} sections with id "v${version}"; a version has one`,
      );
    }
  }
  for (const section of new Set(sections)) {
    if (!versions.includes(section)) {
      found.push(`site/release-notes.html has a section for ${section}, which no changelog has`);
    }
  }
  const order = [...new Set(sections)].filter((section) => versions.includes(section));
  const expected = versions.filter((version) => order.includes(version));
  if (order.join() !== expected.join()) {
    found.push(
      `site/release-notes.html sections are ${order.join(", ")}; newest first is ${expected.join(", ")}`,
    );
  }
  const headed = /^##\s+\S+\s+(\S+)\s*$/m.exec(notes)?.[1];
  if (headed !== versions[0]) {
    found.push(
      `RELEASE_NOTES.md is headed ${headed ?? "by no version"}; the newest in the changelogs is ${versions[0]}`,
    );
  }
  return found;
}

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    const log = (...versions) =>
      versions.map((version) => `## ${version}\n\n- a change\n`).join("\n");
    const page = (...versions) =>
      versions.map((version) => `<section id="v${version}"><h2>${version}</h2></section>`).join("");
    const notes = (version) => `## Product ${version}\n\nWhat it is.\n`;
    const cases = [
      [
        "a version cut and the page not told",
        [log("1.1.0", "1.0.0")],
        page("1.0.0"),
        notes("1.1.0"),
        'has no <section id="v1.1.0">',
      ],
      [
        "a version only one package has",
        [log("1.0.0"), log("1.0.1", "1.0.0")],
        page("1.0.0"),
        notes("1.0.1"),
        'has no <section id="v1.0.1">',
      ],
      ["a section twice", [log("1.0.0")], page("1.0.0", "1.0.0"), notes("1.0.0"), "has 2 sections"],
      [
        "a section for a version nobody released",
        [log("1.0.0")],
        page("1.0.0", "0.9.0"),
        notes("1.0.0"),
        "which no changelog has",
      ],
      [
        "oldest first",
        [log("1.0.0", "1.0.0-next.1", "1.0.0-next.0")],
        page("1.0.0-next.0", "1.0.0-next.1", "1.0.0"),
        notes("1.0.0"),
        "newest first is 1.0.0, 1.0.0-next.1, 1.0.0-next.0",
      ],
      [
        "the notes headed by an older version",
        [log("1.1.0", "1.0.0")],
        page("1.1.0", "1.0.0"),
        notes("1.0.0"),
        "RELEASE_NOTES.md is headed 1.0.0",
      ],
    ];
    const missed = cases.filter(
      ([, changelogs, html, text, wanted]) =>
        !problems(changelogs, html, text).some((line) => line.includes(wanted)),
    );
    const order = ["1.0.0-next.2", "1.0.0", "1.0.0-next.10", "0.9.9", "1.0.1-next.0"].sort(
      newestFirst,
    );
    const clean = problems(
      [log("1.0.0", "1.0.0-next.10", "1.0.0-next.2"), log("1.0.0")],
      page("1.0.0", "1.0.0-next.10", "1.0.0-next.2"),
      notes("1.0.0"),
    );
    if (
      missed.length > 0 ||
      clean.length > 0 ||
      order.join() !== "1.0.1-next.0,1.0.0,1.0.0-next.10,1.0.0-next.2,0.9.9"
    ) {
      console.error("release notes self-test: FAILED");
      for (const [title] of missed) console.error(`  did not refuse: ${title}`);
      for (const line of clean) console.error(`  refused a page in step: ${line}`);
      console.error(`  newest first came out as: ${order.join(", ")}`);
      process.exit(1);
    }
    console.log(
      `release notes self-test: red on ${cases.length} ways out of step, clean on a page in step, as required`,
    );
    process.exit(0);
  }
  const changelogs = readdirSync("packages")
    .map((name) => join("packages", name, "CHANGELOG.md"))
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, "utf8"));
  const found = problems(
    changelogs,
    readFileSync("site/release-notes.html", "utf8"),
    readFileSync("RELEASE_NOTES.md", "utf8"),
  );
  if (found.length > 0) {
    for (const line of found) console.error(`release notes: ${line}`);
    process.exit(1);
  }
  const versions = [...new Set(changelogs.flatMap(changelogVersions))].sort(newestFirst);
  console.log(
    `release notes: ${versions.length} version(s), newest ${versions[0]}, each with its page section`,
  );
}
