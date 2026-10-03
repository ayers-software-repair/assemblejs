// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CompiledTemplate } from "./compiled-template.js";

/** Compiles a template's source, throwing on a template the engine cannot read. */
export type TemplateCompiler = (source: string) => CompiledTemplate;
