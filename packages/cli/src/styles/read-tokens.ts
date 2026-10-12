// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import postcss from "postcss";

/**
 * The tokens a stylesheet binds at `:root`, by scheme: the light scheme is every custom property
 * declared at the top, and the dark scheme is the same rebound by whatever a
 * `prefers-color-scheme: dark` media rule declares at `:root`, so a role the dark scheme leaves
 * alone keeps its light value, as the browser would have it. Throws what postcss throws for a
 * sheet it cannot read.
 */
export function readTokens(css: string): {
  readonly light: ReadonlyMap<string, string>;
  readonly dark: ReadonlyMap<string, string>;
} {
  const light = new Map<string, string>();
  const dark = new Map<string, string>();
  const root = postcss.parse(css);
  root.walkRules(/^:root$/, (rule) => {
    const media = rule.parent?.type === "atrule" ? rule.parent : undefined;
    const scheme =
      media === undefined
        ? light
        : "params" in media && /prefers-color-scheme:\s*dark/.test(String(media.params))
          ? dark
          : undefined;
    if (scheme === undefined) return;
    rule.walkDecls(/^--/, (declaration) => {
      scheme.set(declaration.prop, declaration.value.trim());
    });
  });
  return { light, dark: new Map([...light, ...dark]) };
}
