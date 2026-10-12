// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { VueDescriptor } from "./vue-descriptor.js";

/**
 * The functions of Vue's single-file component compiler a build calls, typed here so the
 * command line carries no dependency on Vue: the project's own copy is loaded, and only when it
 * has a Vue view.
 */
export interface VueCompiler {
  parse(
    source: string,
    options: { readonly filename: string },
  ): { readonly descriptor: VueDescriptor; readonly errors: readonly unknown[] };
  compileScript(
    descriptor: VueDescriptor,
    options: {
      readonly id: string;
      readonly isProd: boolean;
      readonly genDefaultAs: string;
      readonly inlineTemplate: boolean;
      readonly templateOptions: {
        readonly ssr: boolean;
        readonly ssrCssVars: readonly string[];
        readonly compilerOptions: { readonly scopeId?: string };
      };
    },
  ): { readonly content: string; readonly bindings?: Readonly<Record<string, unknown>> };
  compileTemplate(options: {
    readonly source: string;
    readonly filename: string;
    readonly id: string;
    readonly scoped: boolean;
    readonly isProd: boolean;
    readonly ssr: boolean;
    readonly ssrCssVars: readonly string[];
    readonly compilerOptions: {
      readonly scopeId?: string;
      readonly bindingMetadata?: Readonly<Record<string, unknown>>;
    };
  }): { readonly code: string; readonly errors: readonly unknown[] };
  compileStyle(options: {
    readonly source: string;
    readonly filename: string;
    readonly id: string;
    readonly scoped: boolean;
    readonly isProd: boolean;
  }): { readonly code: string; readonly errors: readonly unknown[] };
}
