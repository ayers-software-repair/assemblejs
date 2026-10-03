// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CompiledTemplate } from "./compiled-template.js";

/**
 * Compiles a template's source. A template the engine cannot read throws, when compiled or, for
 * an engine that compiles on first use as Handlebars does, when first rendered.
 */
export type TemplateCompiler = (source: string) => CompiledTemplate;
