// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import postcss from "postcss";
import type { Rule } from "postcss";
import selectorParser from "postcss-selector-parser";

/**
 * One assembly's stylesheet for its own shadow root, where the shadow boundary already does
 * the scoping: selectors are left as written, and `:scope` names the envelope as the shadow
 * root sees it, `:host`.
 */
export function shadowCss(css: string, from: string): string {
  const transform = selectorParser((selectors) => {
    selectors.walkPseudos((pseudo) => {
      if (pseudo.value === ":scope") pseudo.value = ":host";
    });
  });
  const root = postcss.parse(css, { from });
  root.walkRules((rule: Rule) => {
    rule.selector = transform.processSync(rule.selector);
  });
  return root.toString();
}
