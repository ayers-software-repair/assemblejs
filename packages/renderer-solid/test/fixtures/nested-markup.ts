// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { counterMarkup } from "./counter-markup.js";

/** The child placement's envelope, as the composer gives it to the outer assembly. */
export const INNER_ENVELOPE = `<assembly-root data-id="b">${counterMarkup("b")}</assembly-root>`;

/**
 * What the server half renders the outer fixture to as placement "a", with the counter placement
 * "b" inside it: two islands whose keys would be the same without their ids.
 */
export const NESTED_MARKUP =
  '<article data-hk="a000"><!--$--><div data-hk="a00100" data-assembly-slot="inner" >' +
  INNER_ENVELOPE +
  '</div><!--/--><!--$--><button data-hk="a0020" type="button"><!--$-->Outer<!--/--> ' +
  "<!--$-->0<!--/--></button><!--/--></article>";
