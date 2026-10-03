// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import postcss from "postcss";
import type { AtRule, Container, Document, Rule } from "postcss";
import selectorParser from "postcss-selector-parser";

const KEYFRAMES = /keyframes$/i;
// What names the whole document, or the shadow host, where an author wrote it; in an assembly's
// sheet the nearest thing to either is the assembly's own envelope.
const DOCUMENT_TAGS = new Set(["html", "body"]);
const DOCUMENT_PSEUDOS = new Set([":root", ":host"]);

/**
 * One assembly's stylesheet, scoped to that assembly: every selector is placed inside the
 * assembly's envelope, `assembly-root[data-name="cart"]`, so two assemblies written apart can use
 * the same class names without touching each other. `:scope` names the envelope itself, and so
 * does a selector that starts at the document (`:root`, `html`, `body`) or the shadow host
 * (`:host`). Inside `:not()` or `:is()` a `:scope` is the envelope too, and the rule is still
 * scoped, so it can never reach outside the assembly. Rules inside `@media`, `@supports`,
 * `@container` and `@layer` are scoped like any other; a nested rule is scoped through the rule
 * it is nested in; inside `@scope`, `:scope` keeps the meaning `@scope` gives it.
 *
 * What is global by nature stays global, and is not pretended otherwise: `@keyframes`,
 * `@font-face`, `@import` and `@page` define names and resources for the whole document. A
 * nested assembly sits inside its parent's envelope, so a parent's descendant selectors reach
 * into it.
 */
export function scopeCss(css: string, name: string, from: string): string {
  const scope = `assembly-root[data-name="${name.replace(/["\\]/g, "\\$&")}"]`;
  const envelope = () => selectorParser.tag({ value: scope });
  const transform = (inScope: boolean) =>
    selectorParser((selectors) => {
      selectors.each((selector) => {
        let named = false;
        const first = selector.first;
        if (
          (first.type === "tag" && DOCUMENT_TAGS.has(first.value.toLowerCase())) ||
          (first.type === "pseudo" &&
            DOCUMENT_PSEUDOS.has(first.value.toLowerCase()) &&
            first.nodes.length === 0)
        ) {
          const replacement = envelope();
          replacement.spaces.before = first.spaces.before;
          first.replaceWith(replacement);
          named = true;
        }
        if (!inScope) {
          selector.walkPseudos((pseudo) => {
            if (pseudo.value !== ":scope") return;
            // Only a :scope in the selector's own compounds names the element the rule styles.
            if (pseudo.parent === selector) named = true;
            pseudo.replaceWith(envelope());
          });
        }
        if (named) return;
        // The whitespace before a selector in a list belongs before its scope, not inside it.
        const lead = selector.first.spaces.before;
        selector.first.spaces.before = "";
        const tag = envelope();
        tag.spaces.before = lead;
        selector.insertBefore(selector.first, selectorParser.combinator({ value: " " }));
        selector.insertBefore(selector.first, tag);
      });
    });
  const root = postcss.parse(css, { from });
  root.walkRules((rule: Rule) => {
    let inScope = false;
    for (
      let parent: Container | Document | undefined = rule.parent;
      parent !== undefined;
      parent = parent.parent
    ) {
      // A nested rule's selector is read inside its parent's, which is already scoped.
      if (parent.type === "rule") return;
      if (parent.type === "atrule") {
        const at = (parent as AtRule).name.toLowerCase();
        if (KEYFRAMES.test(at)) return;
        if (at === "scope") inScope = true;
      }
    }
    rule.selector = transform(inScope).processSync(rule.selector);
  });
  return root.toString();
}
