// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { DiscoveredAssembly } from "@asmjs/build";
import type { ProjectProblem } from "@asmjs/build";
import { spreadElement } from "./spread-element.js";
import { unnamedControls } from "./unnamed-controls.js";
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
 * - `a-control-has-a-name`: an `input`, a `select` or a `textarea` with no name the reader can
 *   find, as `unnamedControls` judges it (WCAG 2.2, 3.3.2 and 4.1.2, level A).
 */
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
      if (element.tag === "img" && !element.attributes.has("alt") && !spreadElement(element)) {
        problems.push({
          path: file,
          rule: "an-image-has-an-alternative",
          message: `"${name}" writes an <img> with no alt, so what it shows has no text alternative`,
          fix: `give the <img> an alt that says what it shows, or alt="" if it is decoration`,
        });
      }
    }
    for (const { file, element } of unnamedControls(written)) {
      problems.push({
        path: file,
        rule: "a-control-has-a-name",
        message: `"${name}" writes a control, <${element.tag}>, with no name: no label for it, and no aria-label or title`,
        fix: `give the <${element.tag}> an id and a <label for> it, or wrap it in a <label>; an aria-label names a control that shows no label`,
      });
    }
  }
  return problems;
}
