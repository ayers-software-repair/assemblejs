// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { loadEjs } from "./load-ejs.js";
import { loadHandlebars } from "./load-handlebars.js";
import { loadMarkdown } from "./load-markdown.js";
import { loadNunjucks } from "./load-nunjucks.js";
import { loadPug } from "./load-pug.js";
import type { TemplateCompiler } from "./template-compiler.js";
import type { TemplateEngine } from "./template-engine.js";

const LOADERS: Readonly<Record<TemplateEngine, () => Promise<TemplateCompiler>>> = {
  ejs: loadEjs,
  handlebars: loadHandlebars,
  markdown: loadMarkdown,
  nunjucks: loadNunjucks,
  pug: loadPug,
};

const loaded = new Map<TemplateEngine, Promise<TemplateCompiler>>();

/**
 * The compiler for an engine, imported the first time a template in that language renders, so a
 * project using one language never loads the other four. An engine that fails to load is tried
 * again on the next render rather than remembered as broken.
 */
export function loadCompiler(engine: TemplateEngine): Promise<TemplateCompiler> {
  const existing = loaded.get(engine);
  if (existing !== undefined) return existing;
  const loading = LOADERS[engine]();
  loaded.set(engine, loading);
  loading.catch(() => loaded.delete(engine));
  return loading;
}
