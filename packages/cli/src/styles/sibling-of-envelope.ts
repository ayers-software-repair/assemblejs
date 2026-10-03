// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import selectorParser from "postcss-selector-parser";

const DOCUMENT_TAGS = new Set(["html", "body"]);
const ENVELOPE_PSEUDOS = new Set([":scope", ":root", ":host"]);

/**
 * The selectors in a rule's selector list that name the assembly's envelope and then a sibling
 * of it (`:scope ~ .note`, `body + aside`): scoped, the envelope is the assembly itself, so its
 * siblings are outside the assembly, which scoping exists to keep a stylesheet out of.
 */
export function siblingOfEnvelope(selector: string): readonly string[] {
  const found: string[] = [];
  selectorParser((selectors) => {
    selectors.each((one) => {
      let compound: selectorParser.Node[] = [];
      let first = true;
      const namesEnvelope = (nodes: readonly selectorParser.Node[]): boolean =>
        nodes.some(
          (node) =>
            (node.type === "pseudo" && ENVELOPE_PSEUDOS.has(node.value.toLowerCase())) ||
            (first && node.type === "tag" && DOCUMENT_TAGS.has(node.value.toLowerCase())),
        );
      for (const node of one.nodes) {
        if (node.type !== "combinator") {
          compound.push(node);
          continue;
        }
        if (["~", "+"].includes(node.value.trim()) && namesEnvelope(compound)) {
          found.push(one.toString().trim());
          return;
        }
        compound = [];
        first = false;
      }
    });
  }).processSync(selector);
  return found;
}
