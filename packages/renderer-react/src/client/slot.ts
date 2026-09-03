// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { createElement } from "react";
import type { ReactElement } from "react";

/**
 * Places a child assembly's already-rendered HTML.
 *
 * It is inserted verbatim, which is the single exception in the whole boundary and is safe for
 * one reason: this html was produced by the composer from another assembly's own renderer, not
 * by anything a visitor supplied. Nothing else in a React assembly may use dangerouslySetInnerHTML.
 */
export function Slot({
  children,
  name,
}: {
  readonly children: Readonly<Record<string, string>>;
  readonly name: string;
}): ReactElement {
  return createElement("div", {
    "data-assembly-slot": name,
    dangerouslySetInnerHTML: { __html: children[name] ?? "" },
  });
}
