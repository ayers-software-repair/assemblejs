// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { TemplateEngine } from "./template-engine.js";

/** The file extension that names each engine, the one a view file of that language carries. */
export const TEMPLATE_EXTENSIONS: Readonly<Record<TemplateEngine, string>> = {
  ejs: ".ejs",
  handlebars: ".hbs",
  markdown: ".md",
  nunjucks: ".njk",
  pug: ".pug",
};
