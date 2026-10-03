// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const pascal = (name: string): string =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

const VIEWS: Readonly<Record<string, (name: string) => readonly [string, string]>> = {
  html: (name) => [`${name}.html`, `<p>${name}</p>\n`],
  react: (name) => [
    `${name}.react.tsx`,
    `import type { AssemblyProps } from "@assemblejs/renderer-react";

export default function ${pascal(name)}({ data }: AssemblyProps) {
  return <p>${name} {Object.keys(data).length}</p>;
}
`,
  ],
  lit: (name) => [
    `${name}.lit.ts`,
    `import type { AssemblyProps } from "@assemblejs/renderer-lit";
import { html } from "lit";

export default (props: AssemblyProps) => html\`<p>${name} \${Object.keys(props.data).length}</p>\`;
`,
  ],
  preact: (name) => [
    `${name}.preact.tsx`,
    `import type { AssemblyProps } from "@assemblejs/renderer-preact";

export default function ${pascal(name)}({ data }: AssemblyProps) {
  return <p>${name} {Object.keys(data).length}</p>;
}
`,
  ],
  solid: (name) => [
    `${name}.solid.tsx`,
    `import type { AssemblyProps } from "@assemblejs/renderer-solid";

export default function ${pascal(name)}(props: AssemblyProps) {
  return <p>${name} {Object.keys(props.data).length}</p>;
}
`,
  ],
  svelte: (name) => [
    `${name}.svelte`,
    `<script lang="ts">
  let { data } = $props();
</script>

<p>${name} {Object.keys(data).length}</p>
`,
  ],
  vue: (name) => [
    `${name}.vue`,
    `<script setup lang="ts">
defineProps<{ data: Record<string, unknown> }>();
</script>

<template>
  <p>${name} {{ Object.keys(data).length }}</p>
</template>
`,
  ],
};

/**
 * What a new assembly is made of: one view, named so its renderer is visible from a directory
 * listing, written in its framework's own idiom and nothing else. Every renderer here is one the
 * build can build, so a scaffold always builds.
 */
export function assemblyFiles(
  name: string,
  renderer: string,
): Readonly<Record<string, string>> | undefined {
  const view = Object.hasOwn(VIEWS, renderer) ? VIEWS[renderer] : undefined;
  if (view === undefined) return undefined;
  const [file, body] = view(name);
  return { [`src/assemblies/${name}/${file}`]: body };
}
