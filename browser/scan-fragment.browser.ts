// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "@playwright/test";
import { scanFragment } from "../packages/core/dist/index.js";

// THE SCANNER AGAINST THE BROWSER IT STANDS IN FOR. A remote's answer is accepted only when it
// stays inside its envelope wherever a page can place it; whether it does is the browser's
// parser's call, not the scanner's. So fragments are generated from the tags and comments where
// the two could disagree, and every one the scanner accepts is parsed by Chromium in each
// context a placement legitimately sits in. Seeded, so a failure names a fragment that
// reproduces.
const NAMES = (
  "div p li ul ol td tr table tbody a b i svg math foreignObject title style script template " +
  "select option button h1 h2 form textarea assembly-root dd dt dl ruby rt rb br img span nobr " +
  "em pre caption colgroup col mi desc"
).split(" ");
const OTHER = ["t", " ", "<", "&lt;", "</ x>", '<x y="<div>">', "</p >"];
const COMMENTS = ["<!-- c -->", "<!---->", "<!-->", "<!--x--!>", "<!--[-->"];
const CONTEXTS: ReadonlyArray<readonly [string, string]> = [
  ["<div id=ctx>", "</div>"],
  ["<ul><li id=ctx>", "</li></ul>"],
  ["<table><tbody><tr><td id=ctx>", "</td></tr></tbody></table>"],
  ["<dl><dd id=ctx>", "</dd></dl>"],
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

test("every answer the scanner accepts stays inside its envelope in Chromium", async ({ page }) => {
  const fragment = generator(20261003);
  const accepted: string[] = [];
  for (let tried = 0; tried < 100_000; tried += 1) {
    const html = fragment();
    if (typeof scanFragment(html) !== "string") accepted.push(html);
  }
  // Enough accepted fragments that the comparison means something.
  expect(accepted.length).toBeGreaterThan(1000);
  const escaped = await page.evaluate(
    ({ accepted, contexts }) => {
      const out: string[] = [];
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
            [...doc.querySelectorAll("assembly-root")].every((found) => envelope.contains(found));
          if (!inside) out.push(`${open} ${html}`);
        }
      }
      return out;
    },
    { accepted, contexts: CONTEXTS },
  );
  expect(escaped).toEqual([]);
});
