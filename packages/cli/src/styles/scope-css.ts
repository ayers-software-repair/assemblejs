// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import postcss from "postcss";
import type { AtRule, Container, Document, Rule } from "postcss";
import selectorParser from "postcss-selector-parser";

const KEYFRAMES = /keyframes$/i;
// What names the whole document, or the shadow host, where an author wrote it; in an assembly's
// sheet the nearest thing to either is the assembly's own envelope.
const DOCUMENT_TAGS = new Set(["html", "body"]);

/**
 * One assembly's stylesheet, scoped to that assembly: every selector is placed inside the
 * assembly's envelope, `assembly-root[data-name="cart"]`, so two assemblies written apart can use
 * the same class names without touching each other. `:scope` names the envelope itself, and so
 * does a selector that starts at the document (`:root`, `html`, `body`, `html body`) or the
 * shadow host (`:host`, and `:host(.on)` as the envelope with `.on`); a document start that says
 * more (`html.dark`) stays a condition on the document, with the envelope inside it. Inside `:not()` or `:is()` a `:scope` is the envelope too, and the rule is still
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
        let named = readDocumentStart(selector, envelope);
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

/**
 * Rewrites a selector that starts at the document or the shadow host so it starts at the
 * envelope, and answers whether it did, so the caller does not scope it a second time.
 */
function readDocumentStart(
  selector: selectorParser.Selector,
  envelope: () => selectorParser.Tag,
): boolean {
  const nodes = selector.nodes;
  const first = nodes[0];
  if (first === undefined) return false;
  const end = (from: number): number => {
    const at = nodes.findIndex((node, index) => index >= from && node.type === "combinator");
    return at === -1 ? nodes.length : at;
  };
  const lower = first.value?.toLowerCase() ?? "";
  if (first.type === "pseudo" && lower === ":host") {
    const replacement = envelope();
    replacement.spaces.before = first.spaces.before;
    const inner = first.nodes[0]?.nodes.map((node) => node.clone()) ?? [];
    first.replaceWith(replacement);
    let after: selectorParser.Node = replacement;
    for (const node of inner) {
      selector.insertAfter(after, node);
      after = node;
    }
    return true;
  }
  const documentNode =
    (first.type === "tag" && DOCUMENT_TAGS.has(lower)) ||
    (first.type === "pseudo" && lower === ":root" && first.nodes.length === 0);
  if (!documentNode) return false;
  const compound = end(0);
  // `html body` is the document as much as `html` is.
  const combinator = nodes[compound];
  const next = nodes[compound + 1];
  const kind = combinator?.type === "combinator" ? combinator.value.trim() : undefined;
  if (
    lower !== "body" &&
    (kind === "" || kind === ">") &&
    next?.type === "tag" &&
    next.value.toLowerCase() === "body" &&
    end(compound + 1) === compound + 2
  ) {
    next.remove();
    combinator?.remove();
  }
  if (compound === 1) {
    const replacement = envelope();
    replacement.spaces.before = first.spaces.before;
    first.replaceWith(replacement);
    return true;
  }
  const last = nodes[compound - 1];
  if (last === undefined) return false;
  const tag = envelope();
  selector.insertAfter(last, tag);
  selector.insertAfter(last, selectorParser.combinator({ value: " " }));
  return true;
}
