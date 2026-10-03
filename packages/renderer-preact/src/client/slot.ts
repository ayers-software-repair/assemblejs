// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { h } from "preact";
import type { ComponentChild } from "preact";

/**
 * Places a child assembly's already-rendered HTML.
 *
 * It is inserted verbatim, which is the single exception in the whole boundary and is safe for
 * one reason: this html was produced by the composer from another assembly's own renderer, not
 * by anything a visitor supplied. Nothing else in a Preact assembly may use dangerouslySetInnerHTML.
 */
export function Slot({
  children,
  name,
}: {
  readonly children: Readonly<Record<string, string>>;
  readonly name: string;
}): ComponentChild {
  return h("div", {
    "data-assembly-slot": name,
    dangerouslySetInnerHTML: { __html: children[name] ?? "" },
  });
}
