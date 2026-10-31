// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Window } from "happy-dom";

/** Check resolved product assets and shared navigation in each generated reference page. */
export function frameAssetProblems(html, file, site) {
  const window = new Window({
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
    },
  });
  const problems = [];
  try {
    window.document.documentElement.innerHTML = html;
    const document = window.document;
    const base = new URL(file, "https://frame.invalid/");
    const matches = (selector, attribute, target) => {
      const nodes = [...document.querySelectorAll(selector)];
      const wanted = new URL(target, "https://frame.invalid/").href;
      if (
        !nodes.some((node) => {
          const value = node.getAttribute(attribute);
          return value !== null && new URL(value, base).href === wanted;
        })
      )
        problems.push(`${file}: ${selector} does not resolve to ${target}`);
      if (!existsSync(join(site, target))) problems.push(`${file}: missing local ${target}`);
    };
    for (const target of ["skin.css", "landing-brand.css", "api-theme.css"]) {
      matches('head link[rel="stylesheet"]', "href", target);
    }
    matches('head link[rel="icon"]', "href", "favicon.svg");
    matches("header.product-header .product-brand img", "src", "mark.svg");
    matches("header.product-header .product-brand", "href", "index.html");
    for (const target of ["downloads.html", "docs/index.html", "support.html"]) {
      matches("header.product-header .product-nav a", "href", target);
    }
    if (document.querySelectorAll("header.product-header .product-brand").length !== 1) {
      problems.push(`${file}: expected one product home link`);
    }
    return problems;
  } finally {
    window.happyDOM.abort();
  }
}
