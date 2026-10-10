// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// One page of the site as text, for scripts/site-llms.mjs: its title, the paragraph beneath
// it, and every block of its main content as a paragraph of Markdown.
//
// Read from the page's DOM, with the DOM the tests already use. Each element the pages hold has
// one way of being said here, and an element with none, or words that stand in no paragraph,
// stops the reader with the page's name, so markup added to a page is never dropped in silence.
// A page's footer and its mark are left out: a reader of text has no use for either.
import { posix } from "node:path";
import { Window } from "happy-dom";

const TEXT = 3;
const ELEMENT = 1;
// What holds other blocks and says nothing of its own.
const CONTAINERS = new Set(["main", "section", "div", "header", "dl"]);
// What stands inside a line of text.
const INLINE = new Set(["a", "code", "span"]);
// What a page shows and a reader of text has no use for: its links, and its mark.
const SKIPPED = new Set(["footer", "img"]);

const tagOf = (node) => node.tagName.toLowerCase();
// Words as a line holds them: their white space one space.
const squeezed = (text) => text.replace(/\s+/g, " ");
// A "<" in prose, kept from opening a tag, which a Markdown reader would take it for and show
// nothing of. Code is shown as written, so nothing in it is touched.
const inProse = (text) => text.replaceAll("<", "\\<");

/** A link as the site's root sees it, from the page that holds it; one that leaves the site as is. */
const fromRoot = (href, file) =>
  /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("#")
    ? href
    : posix.normalize(posix.join(posix.dirname(file), href));

/** One line of text: what these nodes hold, their code as code and their links as links. */
function line(nodes, file, code = false) {
  let said = "";
  for (const node of nodes) {
    if (node.nodeType === TEXT) {
      said += code ? squeezed(node.textContent) : inProse(squeezed(node.textContent));
    }
    if (node.nodeType !== ELEMENT) continue;
    const tag = tagOf(node);
    if (!INLINE.has(tag)) {
      throw new Error(`${file}: <${tag}> inside a line of text has no way of being said here`);
    }
    const inner = line(node.childNodes, file, code || tag === "code");
    if (tag === "code") said += `\`${inner}\``;
    else if (tag === "a") said += `[${inner}](${fromRoot(node.getAttribute("href") ?? "", file)})`;
    else said += inner;
  }
  return said.trim();
}

/** A fence no run of backticks in the code can close. */
const fenced = (code) => {
  const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map((run) => run[0].length));
  const fence = "`".repeat(longest + 1);
  return `${fence}\n${code.replace(/\n+$/, "")}\n${fence}`;
};

/**
 * What a description holds, in order: each run of text as a line, and each block of code that
 * stands between two of them as a block.
 */
function described(element, file) {
  const blocks = [];
  let run = [];
  const flush = () => {
    const said = line(run, file);
    if (said !== "") blocks.push(said);
    run = [];
  };
  for (const node of element.childNodes) {
    if (node.nodeType === ELEMENT && tagOf(node) === "pre") {
      flush();
      blocks.push(fenced(node.textContent));
    } else run.push(node);
  }
  flush();
  return blocks;
}

/**
 * One page as text: its title, the paragraph beneath it, and every block of its main content,
 * each as a paragraph of Markdown. Throws, naming the page, for an element it cannot say.
 */
export function pageText(html, file) {
  const window = new Window();
  try {
    window.document.write(html);
    const main = window.document.querySelector("main");
    if (main === null) throw new Error(`${file} has no <main>`);
    const blocks = [];
    const walk = (element) => {
      // What labels a group for someone who cannot see it labels it for a reader of text.
      const label = element.getAttribute("aria-label");
      if (label !== null && label !== "") blocks.push(`${label}:`);
      const listed = [];
      for (const node of element.childNodes) {
        if (node.nodeType === TEXT && node.textContent.trim() !== "") {
          throw new Error(
            `${file}: "${node.textContent.trim().slice(0, 40)}" stands outside any paragraph`,
          );
        }
        if (node.nodeType !== ELEMENT) continue;
        const tag = tagOf(node);
        if (SKIPPED.has(tag)) continue;
        // A line of its own beside its siblings: one item of a list.
        if (INLINE.has(tag)) {
          listed.push(`- ${line(node.childNodes, file)}`);
          continue;
        }
        if (listed.length > 0) blocks.push(listed.splice(0).join("\n"));
        if (CONTAINERS.has(tag)) walk(node);
        else if (tag === "h1") blocks.push(`# ${line(node.childNodes, file)}`);
        else if (tag === "h2") blocks.push(`## ${line(node.childNodes, file)}`);
        else if (tag === "dt") blocks.push(`### ${line(node.childNodes, file)}`);
        else if (tag === "p") blocks.push(line(node.childNodes, file));
        else if (tag === "dd") blocks.push(...described(node, file));
        else if (tag === "pre") blocks.push(fenced(node.textContent));
        else throw new Error(`${file}: <${tag}> has no way of being said here`);
      }
      if (listed.length > 0) blocks.push(listed.join("\n"));
    };
    walk(main);
    const said = blocks.filter((block) => block !== "");
    const title = said.find((block) => block.startsWith("# "))?.slice(2);
    if (title === undefined) throw new Error(`${file} has no <h1>`);
    const lede = said[said.findIndex((block) => block.startsWith("# ")) + 1];
    if (lede === undefined || /^(#|-|`)/.test(lede)) {
      throw new Error(`${file} has no paragraph beneath its <h1> to say what it is`);
    }
    const summary = window.document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content");
    return { title, lede, summary: summary ?? undefined, blocks: said };
  } finally {
    void window.happyDOM.close();
  }
}
