// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "@playwright/test";
import { markRemote } from "../packages/core/dist/index.js";

// THE SCANNER AGAINST THE BROWSER IT STANDS IN FOR. A remote's answer is accepted only when it
// stays inside its envelope wherever a placement may hold flow content; whether it does is the
// browser's parser's call, not the scanner's. So fragments are generated from the tags and
// comments where the two could disagree, and every one the scanner accepts is marked as the
// transport marks it and parsed by Chromium in each such context, a declarative shadow root
// included. Inside `<p>`, `<a>` or `<button>` the parser moves block markup out of any assembly,
// local or remote, which is the page's to avoid; ownership holds there all the same, because
// every envelope in an answer carries its origin, which this also requires. Seeded, so a failure
// names a fragment that reproduces.
const NAMES = (
  "div p li ul ol td tr table tbody a b i svg math foreignObject title style script template " +
  "select option button h1 h2 form textarea assembly-root dd dt dl ruby rt rb br img span nobr " +
  "em pre caption colgroup col mi desc plaintext font form template mtext mglyph image select " +
  "malignmark annotation-xml mo ms mn noscript option optgroup input keygen frameset listing xmp " +
  "textarea DIV Svg"
).split(" ");
const OTHER = [
  "t",
  " ",
  "<",
  "&lt;",
  "</ x>",
  '<x y="<div>">',
  "</p >",
  '<font color="red">',
  "<a=b>",
  "<p a=b=c>",
  "\u0000",
  "\r",
  // Balanced pairs random tokens would rarely form, so the cases that need them are generated.
  "<assembly-root data-nested></assembly-root>",
  "<plaintext></plaintext>",
  '<svg><font color="red"></font></svg>',
  "<form></form>",
  "<math><mtext><mglyph><style><div></style></mglyph></mtext></math>",
  "<math><mi><malignmark><textarea><li></textarea></malignmark></mi></math>",
  "<svg><foreignObject><math><mtext><mglyph><title><p></title></mglyph></mtext></math></foreignObject></svg>",
];
const COMMENTS = ["<!-- c -->", "<!---->", "<!-->", "<!--->", "<!--x--!>", "<!--[-->"];
const CONTEXTS: ReadonlyArray<readonly [string, string]> = [
  ["<div id=ctx>", "</div>"],
  ["<ul><li id=ctx>", "</li></ul>"],
  ["<table><tbody><tr><td id=ctx>", "</td></tr></tbody></table>"],
  ["<dl><dd id=ctx>", "</dd></dl>"],
  ["<section id=ctx>", "</section>"],
  ["<span id=ctx>", "</span>"],
  ["<label id=ctx>", "</label>"],
  ["<b><div id=ctx>", "</div></b>"],
  ["<table><caption id=ctx>", "</caption></table>"],
  ["<details id=ctx>", "</details>"],
  ["<fieldset id=ctx>", "</fieldset>"],
  ["<main id=ctx>", "</main>"],
];

const generator = (seed: number) => {
  let state = seed;
  const next = (): number => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T;
  const token = (): string => {
    const roll = next();
    if (roll < 0.42) return `<${pick(NAMES)}${next() < 0.15 ? "/" : ""}>`;
    if (roll < 0.8) return `</${pick(NAMES)}>`;
    return roll < 0.88 ? pick(COMMENTS) : pick(OTHER);
  };
  return (): string =>
    `<assembly-root data-probe>${Array.from({ length: 1 + Math.floor(next() * 8) }, token).join("")}</assembly-root>`;
};

test("every answer the scanner accepts stays inside its envelope in Chromium, stamped", async ({
  page,
}) => {
  const origin = "https://remote.example";
  // Seeded, and another seed can be named to search further: ASSEMBLEJS_SCAN_SEED=7.
  const fragment = generator(Number(process.env["ASSEMBLEJS_SCAN_SEED"] ?? "20261003"));
  const accepted: string[] = [];
  for (let tried = 0; tried < 100_000; tried += 1) {
    const marked = markRemote(fragment(), origin);
    if ("html" in marked) accepted.push(marked.html);
  }
  // Enough accepted fragments that the comparison means something.
  expect(accepted.length).toBeGreaterThan(1000);
  const escaped = await page.evaluate(
    ({ accepted, contexts, origin }) => {
      const out: string[] = [];
      // Every envelope there is carries the remote's origin, and they all sit in the outer one.
      const owned = (root: ParentNode, envelope: Element): boolean =>
        [...root.querySelectorAll("assembly-root")].every(
          (found) => envelope.contains(found) && found.getAttribute("data-remote") === origin,
        );
      for (const html of accepted) {
        for (const [open, close] of contexts) {
          const doc = new DOMParser().parseFromString(
            `<!doctype html><body>${open}${html}<b id=sentinel></b>${close}`,
            "text/html",
          );
          const context = doc.getElementById("ctx");
          const envelope = doc.querySelector("[data-probe]");
          const children = context === null ? [] : [...context.childNodes];
          const inside =
            envelope !== null &&
            children.length === 2 &&
            children[0] === envelope &&
            children[1] === doc.getElementById("sentinel") &&
            owned(doc, envelope);
          if (!inside) out.push(`${open} ${html}`);
        }
        // Inside template content, and inside a declarative shadow root.
        const template = new DOMParser().parseFromString(
          `<!doctype html><body><template id=t>${html}<b id=sentinel></b></template>`,
          "text/html",
        );
        const content = (template.getElementById("t") as HTMLTemplateElement | null)?.content;
        const inTemplate = content === undefined ? [] : [...content.childNodes];
        if (
          content === undefined ||
          inTemplate.length !== 2 ||
          !(inTemplate[0] instanceof Element) ||
          !owned(content, inTemplate[0])
        ) {
          out.push(`template ${html}`);
        }
        const shadowed = Document.parseHTMLUnsafe(
          `<!doctype html><body><div id=host><template shadowrootmode="open">${html}<b id=sentinel></b></template></div>`,
        );
        const shadow = shadowed.getElementById("host")?.shadowRoot;
        const inShadow = shadow === null || shadow === undefined ? [] : [...shadow.childNodes];
        if (
          shadow === null ||
          shadow === undefined ||
          inShadow.length !== 2 ||
          !(inShadow[0] instanceof Element) ||
          !owned(shadow, inShadow[0])
        ) {
          out.push(`shadow ${html}`);
        }
      }
      return out;
    },
    { accepted, contexts: CONTEXTS, origin },
  );
  expect(escaped).toEqual([]);
});
