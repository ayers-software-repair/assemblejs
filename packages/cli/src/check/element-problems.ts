// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { viewElements } from "./view-elements.js";

/**
 * Everything wrong with the elements the views write, as far as their source says
 * (`a-view-has-no-inline-style`): a `style` attribute on an element, written or computed, in any
 * kind of view. It does nothing under the default content security policy, and it is a value
 * invented where it is used rather than set in the assembly's stylesheet (DESIGN 10). A view
 * that cannot be read for its elements is left alone.
 */
export function elementProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): readonly ProjectProblem[] {
  const problems: ProjectProblem[] = [];
  for (const [name, written] of viewElements(root, assemblies)) {
    for (const { file, element } of written) {
      if (!element.attributes.has("style")) continue;
      problems.push({
        path: file,
        rule: "a-view-has-no-inline-style",
        message: `"${name}" writes a style attribute on <${element.tag}>, which the default policy does not apply and which sets a value where it is used`,
        fix: `move the style into a .css file in the assembly's directory, and give the <${element.tag}> a class it reads`,
      });
    }
  }
  return problems;
}
