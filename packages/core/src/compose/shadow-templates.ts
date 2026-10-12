// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { inertSpans } from "./inert-spans.js";
import { withinSpans } from "./within-spans.js";

// A declarative shadow root opens with a template that names its mode; any template closes with
// the same end tag, so the depth is counted and only the roots among them count.
const TEMPLATE = /<(\/?)template\b([^>]*)>/gi;
const SHADOW_ROOT = /\sshadowrootmode\s*=/i;

/**
 * Where a template stands inside a declarative shadow root an element writes for itself: a
 * `<template shadowrootmode="...">` not yet closed. A page's stylesheets do not reach into such
 * a root, and an element's root is the element's own, so an assembly placed there would stand
 * unstyled and its sheet would be linked where it does nothing; a placement there is refused
 * where the directive is read. One pass over the template. A template inside a comment or a
 * raw-text element is no template, by the reading of them it is handed or its own.
 */
export function shadowTemplates(
  template: string,
  inert: (at: number) => boolean = inertSpans(template),
): (at: number) => boolean {
  const spans: Array<readonly [number, number]> = [];
  // The templates open, innermost last: whether each is a shadow root.
  const open: boolean[] = [];
  let rootedAt: number | undefined;
  TEMPLATE.lastIndex = 0;
  for (const match of template.matchAll(TEMPLATE)) {
    if (inert(match.index)) continue;
    const [, slash, attributes = ""] = match;
    if (slash === "/") {
      const wasRoot = open.pop() === true;
      if (wasRoot && !open.includes(true) && rootedAt !== undefined) {
        spans.push([rootedAt, match.index]);
        rootedAt = undefined;
      }
      continue;
    }
    const root = SHADOW_ROOT.test(attributes);
    if (root && rootedAt === undefined) rootedAt = match.index + 1;
    open.push(root);
  }
  if (rootedAt !== undefined) spans.push([rootedAt, template.length + 1]);
  return withinSpans(spans);
}
