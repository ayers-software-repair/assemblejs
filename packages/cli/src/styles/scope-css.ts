// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import postcss from "postcss";
import type { AtRule, Rule } from "postcss";
import selectorParser from "postcss-selector-parser";

const KEYFRAMES = /keyframes$/i;

/**
 * One assembly's stylesheet, scoped to that assembly: every selector is placed inside the
 * assembly's envelope, `assembly-root[data-name="cart"]`, so two assemblies written apart can use
 * the same class names without touching each other. `:scope` names the envelope itself.
 * Rules inside `@media`, `@supports`, `@container` and `@layer` are scoped like any other.
 *
 * What is global by nature stays global, and is not pretended otherwise: `@keyframes`,
 * `@font-face`, `@import` and `@page` define names and resources for the whole document. A
 * nested assembly sits inside its parent's envelope, so a parent's descendant selectors reach
 * into it.
 */
export function scopeCss(css: string, name: string, from: string): string {
  const scope = `assembly-root[data-name="${name}"]`;
  const transform = selectorParser((selectors) => {
    selectors.each((selector) => {
      let named = false;
      selector.walkPseudos((pseudo) => {
        if (pseudo.value === ":scope") {
          pseudo.replaceWith(selectorParser.tag({ value: scope }));
          named = true;
        }
      });
      if (!named) {
        // The whitespace before a selector in a list belongs before its scope, not inside it.
        const first = selector.first;
        const lead = first.spaces.before;
        first.spaces.before = "";
        const tag = selectorParser.tag({ value: scope });
        tag.spaces.before = lead;
        selector.insertBefore(first, selectorParser.combinator({ value: " " }));
        selector.insertBefore(selector.first, tag);
      }
    });
  });
  const root = postcss.parse(css, { from });
  root.walkRules((rule: Rule) => {
    const parent = rule.parent;
    if (parent?.type === "atrule" && KEYFRAMES.test((parent as AtRule).name)) return;
    rule.selector = transform.processSync(rule.selector);
  });
  return root.toString();
}
