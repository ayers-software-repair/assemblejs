// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Window } from "happy-dom";

const brand = JSON.parse(
  readFileSync(new URL("../site-source/pages.json", import.meta.url), "utf8"),
);

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
    if (document.querySelector("base")) problems.push(`${file}: unexpected base element`);
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
    matches('head link[rel="icon"]', "href", brand.favicon);
    matches("header.product-header .product-brand img", "src", brand.mark);
    if (file === "index.html") matches(".assembly-wordmark img", "src", brand.mark);
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
