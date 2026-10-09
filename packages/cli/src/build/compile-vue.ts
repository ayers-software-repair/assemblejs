// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { VueCompiler } from "./vue-compiler.js";
import type { VueDescriptor } from "./vue-descriptor.js";

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * One single-file component compiled for one side: its script with the template rendered into
 * it (a string-building render for the server, a hydrating one for the browser), and its styles,
 * `<style scoped>` scoped by Vue under the same id on both sides so hydration matches, its
 * `v-bind()` variables rendered by the server as by the browser. A compile error throws, with
 * Vue's own message, and so does a part of the component this build does not compile.
 */
export function compileVue(
  compiler: VueCompiler,
  source: string,
  options: { readonly filename: string; readonly id: string; readonly side: "client" | "server" },
): { readonly code: string; readonly loader: "ts" | "js"; readonly css: string } {
  const { filename, id, side } = options;
  const { descriptor, errors } = compiler.parse(source, { filename });
  if (errors.length > 0) throw new Error(`${filename}: ${errors.map(message).join("; ")}`);
  const unsupported = unsupportedParts(descriptor);
  if (unsupported.length > 0) {
    throw new Error(`${filename} uses what this build does not compile: ${unsupported.join(", ")}`);
  }
  const scopeId = `data-v-${id}`;
  const scoped = descriptor.styles.some((style) => style.scoped === true);
  const ssr = side === "server";
  const compilerOptions = scoped ? { scopeId } : {};
  const lines: string[] = [];
  let bindings: Readonly<Record<string, unknown>> | undefined;
  if (descriptor.script !== null || descriptor.scriptSetup !== null) {
    const script = compiler.compileScript(descriptor, {
      id,
      isProd: true,
      genDefaultAs: "_sfc_main",
      inlineTemplate: true,
      templateOptions: { ssr, ssrCssVars: descriptor.cssVars, compilerOptions },
    });
    lines.push(script.content);
    bindings = script.bindings;
  } else {
    lines.push("const _sfc_main = {};");
  }
  // A `<script setup>` has its template inlined above; any other component renders through a
  // function compiled from it here.
  if (descriptor.template !== null && descriptor.scriptSetup === null) {
    const render = ssr ? "ssrRender" : "render";
    const template = compiler.compileTemplate({
      source: descriptor.template.content,
      filename,
      id,
      scoped,
      isProd: true,
      ssr,
      ssrCssVars: descriptor.cssVars,
      compilerOptions: {
        ...compilerOptions,
        ...(bindings === undefined ? {} : { bindingMetadata: bindings }),
      },
    });
    if (template.errors.length > 0) {
      throw new Error(`${filename}: ${template.errors.map(message).join("; ")}`);
    }
    lines.push(template.code.replace(`export function ${render}(`, `function ${render}(`));
    lines.push(`_sfc_main.${render} = ${render};`);
  }
  if (scoped) lines.push(`_sfc_main.__scopeId = ${JSON.stringify(scopeId)};`);
  lines.push("export default _sfc_main;");
  const css = descriptor.styles
    .map((style) => {
      const compiled = compiler.compileStyle({
        source: style.content,
        filename,
        id: scopeId,
        scoped: style.scoped === true,
        isProd: true,
      });
      if (compiled.errors.length > 0) {
        throw new Error(`${filename}: ${compiled.errors.map(message).join("; ")}`);
      }
      return compiled.code;
    })
    .join("\n");
  const typed = [descriptor.script?.lang, descriptor.scriptSetup?.lang].includes("ts");
  return { code: lines.join("\n"), loader: typed ? "ts" : "js", css };
}

// What a component may say that this build would otherwise pass over in silence: a block read
// from another file, a template or stylesheet in another language, CSS modules, and JSX in its
// script. Each would build green and then render wrong.
function unsupportedParts(descriptor: VueDescriptor): readonly string[] {
  const found: string[] = [];
  for (const [name, block] of [
    ["<template>", descriptor.template],
    ["<script>", descriptor.script],
    ["<script setup>", descriptor.scriptSetup],
  ] as const) {
    if (block?.src !== undefined) found.push(`${name.slice(0, -1)} src>`);
  }
  if (![undefined, "html"].includes(descriptor.template?.lang)) {
    found.push(`<template lang="${String(descriptor.template?.lang)}">`);
  }
  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (![undefined, "ts", "js"].includes(block?.lang))
      found.push(`<script lang="${String(block?.lang)}">`);
  }
  for (const style of descriptor.styles) {
    if (style.src !== undefined) found.push("<style src>");
    if (![undefined, "css"].includes(style.lang))
      found.push(`<style lang="${String(style.lang)}">`);
    if (style.module !== undefined && style.module !== false) found.push("<style module>");
  }
  return found;
}
