#!/usr/bin/env node
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// The site's two files for a model to read, generated from site/pages.json and the pages and
// never hand-written:
//
//   llms.txt       the index, in the form llmstxt.org gives: the site's name as an H1, one
//                  blockquote that says what it is, and lists of links under H2s, each with a
//                  note, which is the first sentence beneath that page's title. The pages are
//                  under "Docs"; the links that leave the site are under "Optional", which is
//                  that form's word for what a reader short of room skips.
//   llms-full.txt  every one of those pages as text, in one file, in the same order. Not part
//                  of that form: it is what documentation hosts publish beside the index, for a
//                  reader that wants the whole of it in one request.
//
// `--check` (in `pnpm check`) fails when either file is not what the manifest and the pages say,
// so a page added to the manifest, a sentence changed on a page and a hand edit of either file
// are one kind of drift, found the same way.
//
// Every link is relative to the file that holds it. The one folder is published at two
// addresses, the channel's and the product's, and an absolute link is right at one of them.
//
// A page's text is read by scripts/site-page-text.mjs, from its DOM, and an element that has no
// way of being said in text fails the run, naming the page: markup added to a page cannot
// silently go missing from here.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { pageText } from "./site-page-text.mjs";

/** A paragraph's first sentence: as far as the first full stop that a space follows. */
const firstSentence = (paragraph) => /^.*?\.(?= |$)/.exec(paragraph)?.[0] ?? paragraph;

/** The two files, by the name the manifest gives each, as the manifest and the pages say them. */
export function render(manifest, read) {
  const declared = manifest.llms;
  if (declared === undefined) throw new Error("pages.json declares no llms files");
  const landing = manifest.pages.find((page) => page.file === "index.html");
  if (landing === undefined) throw new Error("pages.json declares no index.html");
  const pages = manifest.pages
    .filter((page) => page.in_llms !== false)
    .map((page) => ({ ...page, ...pageText(read(page.file), page.file) }));
  const home = pages.find((page) => page.file === landing.file);
  if (home?.summary === undefined) {
    throw new Error("index.html has no description to say what the site is");
  }
  const head = `# ${landing.title}\n\n> ${home.summary}`;

  const index = [
    head,
    home.lede,
    `Every link here is relative to this file. All of these pages are one file, [${declared.full}](${declared.full}).`,
    [
      "## Docs",
      "",
      ...pages
        .filter((page) => page.file !== landing.file)
        .map((page) => `- [${page.title}](${page.url}): ${firstSentence(page.lede)}`),
    ].join("\n"),
    [
      "## Optional",
      "",
      ...(manifest.external ?? []).map((link) => `- [${link.title}](${link.url})`),
    ].join("\n"),
  ];
  const full = [
    head,
    `Every page of this site as text, in the order [${declared.index}](${declared.index}) lists them. Every link is relative to this file.`,
    ...pages.map((page) => {
      const [title, ...rest] = page.blocks;
      return [title, `Source: [${page.url}](${page.url})`, ...rest].join("\n\n");
    }),
  ];
  return {
    [declared.index]: `${index.join("\n\n")}\n`,
    [declared.full]: `${full.join("\n\n")}\n`,
  };
}

/**
 * Each file that is not what the manifest and the pages say, as one line; writing puts each
 * right. A page that cannot be said in text is a problem either way, and nothing is written.
 */
export function run(siteRoot, write) {
  const manifest = JSON.parse(readFileSync(join(siteRoot, "pages.json"), "utf8"));
  let wanted;
  try {
    wanted = render(manifest, (file) => readFileSync(join(siteRoot, file), "utf8"));
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
  const problems = [];
  for (const [file, contents] of Object.entries(wanted)) {
    const path = join(siteRoot, file);
    if (existsSync(path) && readFileSync(path, "utf8") === contents) continue;
    if (write) {
      writeFileSync(path, contents);
      console.log(`site llms: wrote ${file}`);
    } else {
      problems.push(`${file} is not what pages.json and the pages say; run scripts/site-llms.mjs`);
    }
  }
  return problems;
}

const isEntryPoint = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isEntryPoint) {
  const mode = process.argv[2];
  if (mode === "--self-test") {
    // A file edited by hand, a page the files have not caught up with, and a page holding an
    // element with no way of being said: each refused. Then written, and right.
    const root = mkdtempSync(join(tmpdir(), "site-llms-"));
    const page = (title, body) =>
      `<html><head><meta name="description" content="What it is."></head><body><main><header><h1>${title}</h1><p>About ${title}. And more of it.</p></header>${body}<footer><p>Not said.</p></footer></main></body></html>`;
    const manifest = {
      llms: { index: "llms.txt", full: "llms-full.txt" },
      pages: [
        { file: "index.html", url: "index.html", title: "Site" },
        { file: "docs/a.html", url: "docs/a.html", title: "A" },
        { file: "404.html", url: "404.html", title: "Not found", in_llms: false },
      ],
      external: [{ url: "https://x.example/", title: "X" }],
    };
    const save = () => writeFileSync(join(root, "pages.json"), JSON.stringify(manifest));
    try {
      mkdirSync(join(root, "docs"));
      save();
      writeFileSync(
        join(root, "index.html"),
        page(
          "Site",
          '<h2>More</h2><p>Text, a &lt;tag&gt; in it, and <code>&lt;one&gt;</code> as code.</p><section aria-label="Kinds"><span>one</span><span>two</span></section><pre>say ```x```</pre>',
        ),
      );
      writeFileSync(
        join(root, "docs", "a.html"),
        page(
          "A",
          '<dl><div><dt><code>run it</code></dt><dd>See <a href="../index.html">home</a>.<pre><code>in it</code></pre>After.</dd></div></dl><pre>a `b`\n</pre>',
        ),
      );
      writeFileSync(join(root, "404.html"), "<p>no main, and never read</p>");
      const missing = run(root, false);
      if (missing.length !== 2) throw new Error(`two files missing, and it saw: ${missing}`);
      run(root, true);
      const index = readFileSync(join(root, "llms.txt"), "utf8");
      const full = readFileSync(join(root, "llms-full.txt"), "utf8");
      const expected =
        "# Site\n\n> What it is.\n\nAbout Site. And more of it.\n\nEvery link here is relative to this file. All of these pages are one file, [llms-full.txt](llms-full.txt).\n\n## Docs\n\n- [A](docs/a.html): About A.\n\n## Optional\n\n- [X](https://x.example/)\n";
      if (index !== expected)
        throw new Error(`the index it wrote is not the one expected:\n${index}`);
      for (const held of [
        "# A\n\nSource: [docs/a.html](docs/a.html)\n\nAbout A. And more of it.\n\n### `run it`\n\nSee [home](index.html).\n\n```\nin it\n```\n\nAfter.\n\n```\na `b`\n```\n",
        "# Site\n\nSource: [index.html](index.html)\n\nAbout Site. And more of it.\n\n## More\n\nText, a \\<tag> in it, and `<one>` as code.\n\nKinds:\n\n- one\n- two\n\n````\nsay ```x```\n````\n",
      ]) {
        if (!full.includes(held)) throw new Error(`the full file lacks:\n${held}\nin:\n${full}`);
      }
      if (full.includes("Not said") || full.includes("Not found")) {
        throw new Error("the full file holds a footer, or a page the manifest leaves out");
      }
      if (run(root, false).length > 0) throw new Error("what it wrote, it then called wrong");

      writeFileSync(join(root, "llms.txt"), index.replace("About A.", "About A, by hand."));
      const edited = run(root, false);
      manifest.pages.push({ file: "docs/b.html", url: "docs/b.html", title: "B" });
      save();
      writeFileSync(join(root, "docs", "b.html"), page("B", ""));
      const behind = run(root, false);
      writeFileSync(join(root, "docs", "b.html"), page("B", "<table><tr><td>1</td></tr></table>"));
      const unsaid = run(root, false);
      writeFileSync(join(root, "docs", "b.html"), page("B", "words in no paragraph"));
      const stray = run(root, false);
      if (
        edited.length !== 1 ||
        !edited[0].startsWith("llms.txt is not what") ||
        behind.length !== 2 ||
        unsaid.length !== 1 ||
        !unsaid[0].startsWith("docs/b.html: <table> has no way of being said") ||
        stray.length !== 1 ||
        !stray[0].startsWith('docs/b.html: "words in no paragraph" stands outside')
      ) {
        console.error("site llms self-test: FAILED to refuse a known-bad site");
        for (const seen of [...edited, ...behind, ...unsaid, ...stray]) {
          console.error(`  saw: ${seen}`);
        }
        process.exit(1);
      }
      console.log(
        "site llms self-test: red on a hand edit, a page the files lack, an element it cannot say and words in no paragraph, as required",
      );
    } catch (error) {
      console.error(
        `site llms self-test: FAILED: ${error instanceof Error ? error.message : error}`,
      );
      process.exit(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
    process.exit(0);
  }
  if (!existsSync("site")) {
    console.log("site llms: no site/ yet, nothing to do");
    process.exit(0);
  }
  const problems = run("site", mode !== "--check");
  if (problems.length > 0) {
    console.error(`site llms: ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  if (mode === "--check") console.log("site llms: both files are what the pages say");
}
