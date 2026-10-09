// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CompiledTemplate } from "./compiled-template.js";

/**
 * Compiles a template's source. A template the engine cannot parse throws when compiled, which
 * is how a build refuses it before a visitor meets it. What the engine resolves only as it
 * renders throws then: a value the data has not, and, in Handlebars and Nunjucks, a helper or a
 * filter the template lacks, a helper given the wrong number of arguments, and a partial, an
 * include or a parent it names, which a view, being one file, never has.
 */
export type TemplateCompiler = (source: string) => CompiledTemplate;
