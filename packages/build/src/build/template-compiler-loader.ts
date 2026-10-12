// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** The project's own loader of a template engine's compiler, by the engine's name. */
export type TemplateCompilerLoader = (
  engine: string,
) => Promise<(source: string) => (input: unknown) => string>;
