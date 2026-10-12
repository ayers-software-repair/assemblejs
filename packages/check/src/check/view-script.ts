// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;

/**
 * The part of a framework view's file that is a module, where its `mount` and `shadow` exports
 * would be written, and how to compile it: a `.ts` or `.tsx` file whole; a Svelte component's
 * module script (`<script module>`, or `context="module"`); a Vue component's plain `<script>`,
 * as its `<script setup>` cannot export a name. Undefined for a view with no such part.
 */
export function viewScript(
  file: string,
  source: string,
): { readonly code: string; readonly loader: "ts" | "tsx" } | undefined {
  if (file.endsWith(".tsx")) return { code: source, loader: "tsx" };
  if (file.endsWith(".ts")) return { code: source, loader: "ts" };
  const wanted = file.endsWith(".svelte")
    ? (attributes: string) => /(^|\s)(module|context="module")(\s|$)/.test(attributes)
    : file.endsWith(".vue")
      ? (attributes: string) => !/(^|\s)setup(\s|=|$)/.test(attributes)
      : undefined;
  if (wanted === undefined) return undefined;
  for (const match of source.matchAll(SCRIPT)) {
    if (wanted(match[1] ?? "")) return { code: match[2] ?? "", loader: "ts" };
  }
  return undefined;
}
