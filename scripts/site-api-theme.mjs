// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// Keep TypeDoc's reference, search and navigation. Read the product frame from the
// maintained homepage so the generated reference cannot acquire a second header/footer.
import { readFileSync } from "node:fs";
import { JSX, PageEvent } from "typedoc";
import { renderLinks, rewrite } from "./site-links.mjs";

export function load(app) {
  const home = readFileSync(new URL("../site/index.html", import.meta.url), "utf8");
  const manifest = JSON.parse(readFileSync(new URL("../site/pages.json", import.meta.url), "utf8"));
  const header = /<header class="product-header">[\s\S]*?<\/header>/.exec(home)?.[0];
  const footer = /<footer class="product-footer">[\s\S]*?<\/footer>/.exec(home)?.[0];
  if (!header || !footer)
    throw new Error("The product homepage must provide its shared header and footer.");
  const relative = (html, context) =>
    html.replace(
      /(href|src)="(?![a-z]+:|#)([^"]+)"/g,
      (_, attribute, path) => `${attribute}="${context.relativeURL("../../" + path)}"`,
    );

  app.renderer.hooks.on("head.end", (context) =>
    JSX.createElement(
      JSX.Fragment,
      null,
      ...["skin.css", "kit/product.css", "landing-brand.css", "api-theme.css"].map((file) =>
        JSX.createElement("link", {
          rel: "stylesheet",
          href: context.relativeURL("../../" + file),
        }),
      ),
      JSX.createElement("link", { rel: "icon", href: context.relativeURL("../../favicon.svg") }),
    ),
  );
  app.renderer.hooks.on("body.begin", (context) =>
    JSX.createElement(JSX.Raw, {
      html:
        '<a class="product-skip" href="#tsd-content">Skip to content</a>' +
        rewrite(
          relative(header, context),
          renderLinks(manifest, { file: `docs/api/${context.page.url}` }),
        ),
    }),
  );
  app.renderer.hooks.on("body.end", (context) =>
    JSX.createElement(JSX.Raw, { html: relative(footer, context) }),
  );
  app.renderer.on(PageEvent.END, (page) => {
    page.contents = page.contents
      .replace("<body>", '<body class="product-site page-reference">')
      .replace(
        'class="col-content"',
        'class="col-content" role="main" id="tsd-content" tabindex="-1"',
      );
  });
}
