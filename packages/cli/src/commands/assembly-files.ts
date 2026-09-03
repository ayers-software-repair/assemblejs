// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const VIEW: Readonly<Record<string, string>> = {
  html: "html",
  svelte: "svelte",
  vue: "vue",
  markdown: "md",
  react: "react.tsx",
  preact: "preact.tsx",
  solid: "solid.tsx",
};

/** What a new assembly is made of. The renderer decides the view file's name. */
export function assemblyFiles(
  name: string,
  renderer: string,
): Readonly<Record<string, string>> | undefined {
  const extension = VIEW[renderer];
  if (extension === undefined) return undefined;

  const body =
    extension === "html" || extension === "md"
      ? `<p>${name}</p>\n`
      : `export default function ${name.replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase())}() {
  return <p>${name}</p>;
}
`;
  return {
    [`src/assemblies/${name}/${name}.${extension}`]: body,
    [`src/assemblies/${name}/${name}.css`]: `/* Styles for ${name}. Scoped to this assembly at build time. */\n`,
  };
}
