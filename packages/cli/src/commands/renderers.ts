// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Every renderer the command can scaffold a view for, which is every renderer the build can
 * build: a scaffold that does not build is the first thing a new author would meet.
 */
export const RENDERERS: readonly string[] = [
  "ejs",
  "handlebars",
  "html",
  "lit",
  "markdown",
  "nunjucks",
  "preact",
  "pug",
  "react",
  "solid",
  "svelte",
  "vue",
];
