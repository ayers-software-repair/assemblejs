// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "../discovery/discovered-assembly.js";
import type { ProjectProblem } from "../discovery/project-problem.js";
import { COMPUTED_MARKER } from "./computed-marker.js";
import { viewElements } from "./view-elements.js";

/**
 * Everything wrong with the elements the views write, as far as their source says, in any kind
 * of view; a view that cannot be read for its elements is left alone, and so is an element the
 * view spreads attributes onto, which may hold what the reader cannot see.
 *
 * - `a-view-has-no-inline-style`: a `style` attribute, written or computed. It does nothing under
 *   the default content security policy, and it is a value invented where it is used rather
 *   than set in the assembly's stylesheet (DESIGN 10).
 * - `an-image-has-an-alternative`: an `img` with no `alt` at all. An empty one says the image is
 *   decoration and passes; one the view computes is present (WCAG 2.2, 1.1.1, level A).
 */
// Whether the view spreads an object onto the element: computed with no attribute of its own
// standing as the marker, which is how every reader writes a spread.
const spread = (element: {
  readonly computed: boolean;
  readonly attributes: ReadonlyMap<string, string | true>;
}): boolean => element.computed && ![...element.attributes.values()].includes(COMPUTED_MARKER);

export function elementProblems(
  root: string,
  assemblies: readonly DiscoveredAssembly[],
): readonly ProjectProblem[] {
  const problems: ProjectProblem[] = [];
  for (const [name, written] of viewElements(root, assemblies)) {
    for (const { file, element } of written) {
      if (element.attributes.has("style")) {
        problems.push({
          path: file,
          rule: "a-view-has-no-inline-style",
          message: `"${name}" writes a style attribute on <${element.tag}>, which the default policy does not apply and which sets a value where it is used`,
          fix: `move the style into a .css file in the assembly's directory, and give the <${element.tag}> a class it reads`,
        });
      }
      // A spread may carry the alt; the reader cannot see it, so it does not refuse.
      if (element.tag === "img" && !element.attributes.has("alt") && !spread(element)) {
        problems.push({
          path: file,
          rule: "an-image-has-an-alternative",
          message: `"${name}" writes an <img> with no alt, so what it shows has no text alternative`,
          fix: `give the <img> an alt that says what it shows, or alt="" if it is decoration`,
        });
      }
    }
  }
  return problems;
}
