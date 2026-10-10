// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { placementDirective } from "@assemblejs/core/client";
import { createElement, useState } from "react";
import type { ReactElement } from "react";

/**
 * Places a child assembly: writes the directive the composer replaces with the child's envelope.
 *
 * It writes the same markup on the server and in the browser. On the server the composer puts
 * the child where the directive stood; in the browser React leaves what a slot holds alone, and
 * `suppressHydrationWarning` says the difference between the two is meant.
 *
 * React compares the object a slot writes by identity when a parent renders again, and one made
 * afresh each time is taken for a change: React would write the slot's markup again and destroy
 * the child living there. So a slot keeps its object in its own state, which React holds for as
 * long as the slot is mounted, and makes another only when its name or its view changes.
 *
 * This is the one place a React assembly writes markup it did not escape, and what it writes is
 * only the directive, built from a name and a view. Nothing else in a React assembly may use
 * dangerouslySetInnerHTML.
 */
export function Slot({
  name,
  view,
}: {
  readonly name: string;
  readonly view?: string;
}): ReactElement {
  const directive = placementDirective(name, view);
  const [written, write] = useState(() => ({ __html: directive }));
  let html = written;
  if (html.__html !== directive) {
    html = { __html: directive };
    write(html);
  }
  return createElement("div", {
    "data-assembly-slot": name,
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: html,
  });
}
