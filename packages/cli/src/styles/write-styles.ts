// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ASSET_ROUTE_PREFIX } from "@assemblejs/core";
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { Io } from "../io/io.js";
import type { AssemblyStyles } from "./assembly-styles.js";
import { scopeCss } from "./scope-css.js";
import { shadowCss } from "./shadow-css.js";

/**
 * Writes each assembly's stylesheets into the build, and answers where each is served by
 * assembly name: its own `.css` files, then its Svelte component's `<style>`, already scoped by
 * Svelte. A file is named by its content's hash, so a page links only the styles of the
 * assemblies it places and a changed stylesheet is a new url.
 *
 * A framework view gets a second sheet for the shadow root it may opt into, because a selector
 * scoped to the envelope matches nothing inside that root. Which of the two is linked is the
 * view's own `shadow` export, read when the server runs, not here.
 */
export function writeStyles(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
  componentCss: ReadonlyMap<string, string>,
  io: Io,
): ReadonlyMap<string, AssemblyStyles> {
  const write = (name: string, parts: readonly string[], suffix: string): string => {
    const css = `${parts.join("\n")}\n`;
    const hash = createHash("sha256").update(css).digest("hex").slice(0, 8);
    const file = `${name}-${hash}${suffix}.css`;
    io.write(join(root, "dist", "client", "styles", file), css);
    return `${ASSET_ROUTE_PREFIX}/styles/${file}`;
  };
  const styles = new Map<string, AssemblyStyles>();
  for (const assembly of assemblies) {
    const sources = assembly.styles.map((file) => ({ file, css: readFileSync(file, "utf8") }));
    const own = componentCss.get(assembly.view);
    if (sources.length === 0 && own === undefined) continue;
    const tail = own === undefined ? [] : [own];
    const scoped = sources.map((source) => scopeCss(source.css, assembly.name, source.file));
    const isolated = sources.map((source) => shadowCss(source.css, source.file));
    styles.set(assembly.name, {
      scoped: write(assembly.name, [...scoped, ...tail], ""),
      shadow:
        assembly.renderer === "html"
          ? undefined
          : write(assembly.name, [...isolated, ...tail], ".shadow"),
    });
  }
  return styles;
}
