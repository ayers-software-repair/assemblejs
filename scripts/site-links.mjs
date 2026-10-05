#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// The site's cross-links, generated from site/pages.json and never hand-written. Each page
// carries one region between `<!-- links -->` and `<!-- /links -->`; this script writes it, and
// `--check` (in `pnpm check`) fails when any region differs from what the manifest says, so a
// page added to the manifest reaches every footer and a link typed by hand cannot drift.
//
// What a page links: the landing page first, unless it is the landing page; then every page the
// manifest marks `in_nav`, except itself, in manifest order; then, on the landing page alone, the
// external links. Joined by the page's own `sep`, with hrefs relative to the page's directory.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { pathToFileURL } from "node:url";

const OPEN = "<!-- links -->";
const CLOSE = "<!-- /links -->";
const REGION = /<!-- links -->([\s\S]*?)<!-- \/links -->/;

/** The anchors one page's region holds, in order, as one string joined by the page's `sep`. */
export function renderLinks(manifest, page) {
  const landing = manifest.pages.find((entry) => entry.file === "index.html");
  const here = posix.dirname(page.file);
  const href = (url) => posix.relative(here === "." ? "" : here, url) || url;
  const anchors = [];
  if (landing !== undefined && page.file !== landing.file) {
    anchors.push(`<a href="${href(landing.url)}">${landing.title}</a>`);
  }
  for (const entry of manifest.pages) {
    if (entry.in_nav !== true || entry.file === page.file) continue;
    anchors.push(`<a href="${href(entry.url)}">${entry.title}</a>`);
  }
  if (landing !== undefined && page.file === landing.file) {
    for (const entry of manifest.external ?? []) {
      anchors.push(`<a href="${entry.url}">${entry.title}</a>`);
    }
  }
  return anchors.join(page.sep ?? " &middot; ");
}

/** The page's html with its region rewritten, keeping the whitespace that framed the old one. */
export function rewrite(html, links) {
  const match = REGION.exec(html);
  if (match === null) return undefined;
  const inner = match[1];
  const lead = /^\s*/.exec(inner)[0];
  const trail = inner.trim() === "" ? "" : /\s*$/.exec(inner)[0];
  return html.replace(REGION, `${OPEN}${lead}${links}${trail}${CLOSE}`);
}

/**
 * Every page whose region is not what the manifest says, or that is in the nav and has no
 * region, as one line each; writing fixes the first kind and never the second.
 */
export function run(siteRoot, write) {
  const manifest = JSON.parse(readFileSync(join(siteRoot, "pages.json"), "utf8"));
  const problems = [];
  for (const page of manifest.pages) {
    const path = join(siteRoot, page.file);
    if (!existsSync(path)) continue;
    const html = readFileSync(path, "utf8");
    const wanted = rewrite(html, renderLinks(manifest, page));
    if (wanted === undefined) {
      if (page.in_nav === true)
        problems.push(`${page.file} is in the nav and has no ${OPEN} region`);
      continue;
    }
    if (wanted === html) continue;
    if (write) {
      writeFileSync(path, wanted);
      console.log(`site links: wrote ${page.file}`);
    } else {
      problems.push(
        `${page.file}: its links are not what pages.json says; run scripts/site-links.mjs`,
      );
    }
  }
  return problems;
}

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  const mode = process.argv[2];
  if (mode === "--self-test") {
    // A page whose region was typed by hand, and a nav page with no region: both refused.
    const root = mkdtempSync(join(tmpdir(), "site-links-"));
    try {
      mkdirSync(join(root, "docs"));
      writeFileSync(
        join(root, "pages.json"),
        JSON.stringify({
          pages: [
            { file: "index.html", url: "index.html", title: "Home", sep: "\n    ", in_nav: false },
            { file: "a.html", url: "a.html", title: "A", sep: " &middot; ", in_nav: true },
            {
              file: "docs/b.html",
              url: "docs/b.html",
              title: "B",
              sep: " &middot; ",
              in_nav: true,
            },
          ],
          external: [{ url: "https://x.example/", title: "X" }],
        }),
      );
      writeFileSync(
        join(root, "index.html"),
        `<footer>\n    ${OPEN}\n    stale\n    ${CLOSE}\n</footer>`,
      );
      writeFileSync(join(root, "a.html"), "<p>no region</p>");
      writeFileSync(
        join(root, "docs", "b.html"),
        `<p>${OPEN}<a href="../a.html">A</a>${CLOSE}</p>`,
      );
      const seen = run(root, false);
      const stale = seen.some((line) => line.startsWith("index.html:"));
      const missing = seen.some((line) => line.startsWith("a.html is in the nav"));
      const wrong = seen.some((line) => line.startsWith("docs/b.html:"));
      if (!stale || !missing || !wrong) {
        console.error("site links self-test: FAILED to refuse a known-bad site");
        for (const line of seen) console.error(`  saw: ${line}`);
        process.exit(1);
      }
      run(root, true);
      const fixed = readFileSync(join(root, "docs", "b.html"), "utf8");
      const expected = `<p>${OPEN}<a href="../index.html">Home</a> &middot; <a href="../a.html">A</a>${CLOSE}</p>`;
      if (fixed !== expected || run(root, false).length !== 1) {
        console.error("site links self-test: FAILED to write the links the manifest says");
        console.error(`  wrote: ${fixed}`);
        process.exit(1);
      }
      console.log(
        "site links self-test: red on a hand-typed region and a nav page without one, as required",
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
    process.exit(0);
  }
  if (!existsSync("site")) {
    console.log("site links: no site/ yet, nothing to do");
    process.exit(0);
  }
  const problems = run("site", mode !== "--check");
  if (problems.length > 0) {
    console.error(`site links: ${problems.length} problem(s):`);
    for (const line of problems) console.error(`  ${line}`);
    process.exit(1);
  }
  console.log(
    mode === "--check"
      ? "site links: every page links what pages.json says"
      : "site links: written",
  );
}
