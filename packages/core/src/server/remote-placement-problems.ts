// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Placement } from "../compose/placement.js";
import { parseContentUrl } from "../remote/parse-content-url.js";
import { insideForm } from "./inside-form.js";
import type { PlacementProblem } from "./placement-problem.js";

/**
 * Everything wrong with one placement from another server, given its url as written: the url
 * must be an assembly's content endpoint, on an origin the project declared as a remote, and the
 * placement cannot sit inside one of the page's forms, where a form's end tag in the remote's
 * answer would close the page's own form and leave the fields after it outside. Boot calls this
 * with the plan's url and `check` with the one the declaration writes, so both refuse the same
 * placement the same way.
 */
export function remotePlacementProblems(
  at: string,
  template: string,
  placement: Placement,
  url: string,
  origins: ReadonlySet<string>,
): readonly PlacementProblem[] {
  const problems: PlacementProblem[] = [];
  const found = (about: PlacementProblem["about"], message: string): void => {
    problems.push({ name: placement.name, about, message: `${at} ${message}` });
  };
  const target = parseContentUrl(url);
  if (target === undefined) {
    found(
      "url",
      `places "${placement.name}" from ${url}, which is not an assembly's content endpoint (https://host/assembly/<name>/)`,
    );
  } else if (!origins.has(target.origin)) {
    found(
      "origin",
      `places "${placement.name}" from ${target.origin}, which is not a declared remote`,
    );
  }
  if (insideForm(template, placement.start)) {
    found(
      "form",
      `places "${placement.name}" from another server inside a <form>, where its markup could end the page's form`,
    );
  }
  return problems;
}
