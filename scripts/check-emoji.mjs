#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// No emojis anywhere: code, docs, commits, comments. It is a repository law and it had no gate,
// which is how a pasted research note or a generated changelog line brings one in.
//
// Scans what git TRACKS, for the same reason the identity gate does: only a tracked file can be
// committed, published, or land in a tarball, and failing on scratch files teaches people to
// skip the gate.
//
// Legacy typographic symbols below U+2000 are not emojis and are not flagged: the copyright sign
// is in NOTICE by law. Everything at or above U+2000 that Unicode calls pictographic is, as are
// flag pairs and the variation selector that makes a glyph render as an emoji.
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";

const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const REGIONAL = /\p{Regional_Indicator}/u;
const VARIATION_SELECTOR = 0xfe0f;

const offending = (line) => {
  const found = [];
  for (const ch of line) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    const isEmoji =
      (code >= 0x2000 && PICTOGRAPHIC.test(ch)) || REGIONAL.test(ch) || code === VARIATION_SELECTOR;
    if (isEmoji) found.push(`U+${code.toString(16).toUpperCase().padStart(4, "0")}`);
  }
  return found;
};

export function scan(paths) {
  const failures = [];
  for (const path of paths) {
    let text;
    try {
      if (statSync(path).isDirectory()) continue;
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    if (text.includes("\0")) continue; // binary
    text.split("\n").forEach((line, index) => {
      const found = offending(line);
      if (found.length) failures.push(`${path}:${index + 1}: ${found.join(" ")}`);
    });
  }
  return failures;
}

// This module is imported by its own tests and by other tooling, so the command-line body only
// runs when it IS the command. Without the guard, importing the module silently ran a full scan
// and printed a verdict nobody asked for.
const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  if (process.argv[2] === "--self-test") {
    const fixture = "scripts/fixtures/emoji-bad/has-emoji.md";
    try {
      statSync(fixture);
    } catch {
      console.error(`emoji gate self-test FAILED: ${fixture} is missing`);
      process.exit(1);
    }
    const found = scan([fixture]);
    if (found.length < 3) {
      console.error(
        `emoji gate self-test FAILED: matched ${found.length} line(s), expected at least 3`,
      );
      for (const f of found) console.error(`  saw: ${f}`);
      process.exit(1);
    }
    const clean = scan(["NOTICE"]);
    if (clean.length) {
      console.error(
        "emoji gate self-test FAILED: it flags the copyright sign, which is not an emoji",
      );
      for (const f of clean) console.error(`  saw: ${f}`);
      process.exit(1);
    }
    console.log(
      `emoji gate self-test: red on ${found.length} line(s), clean on the copyright sign, as required`,
    );
    process.exit(0);
  }

  const tracked = execFileSync("git", ["ls-files", "-c"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    .filter((p) => !p.startsWith("scripts/fixtures/emoji-bad/"));

  const failures = scan(tracked);
  if (failures.length) {
    console.error(`emoji check failed, ${failures.length} line(s):`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(`emoji check: clean (${tracked.length} tracked file(s))`);
}
