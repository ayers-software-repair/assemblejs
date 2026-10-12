// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { rendererForView } from "./renderer-for-view.js";

// What stands beside a view and is not one: a test, a spec, a story.
const BESIDE = /\.(?:test|spec|stories|story)\.[a-z]+$/;

/**
 * Whether a file in an assembly's directory is a view of it: a file whose name says its
 * renderer, and is not its browser half, a test or a story beside it, or prose.
 *
 * Prose is a Markdown file under any name but the assembly's. Markdown is a renderer, so
 * `about/about.md` is a view; a README beside any view is a README. Counted as views, a README
 * and a test each made their assembly one with two views, which is no assembly.
 */
export function isView(assembly: string, file: string): boolean {
  if (file.endsWith(".client.ts") || BESIDE.test(file)) return false;
  const renderer = rendererForView(file);
  if (renderer === undefined) return false;
  return renderer !== "markdown" || file === `${assembly}.md`;
}
