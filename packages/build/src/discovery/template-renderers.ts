// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * The renderers whose views are templates in a language of their own, read as text and rendered
 * on the server by `@assemblejs/renderer-templates`, each named for its engine.
 */
export const TEMPLATE_RENDERERS: readonly string[] = [
  "ejs",
  "handlebars",
  "markdown",
  "nunjucks",
  "pug",
];
