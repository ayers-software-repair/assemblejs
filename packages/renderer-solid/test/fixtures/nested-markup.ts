// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { counterMarkup } from "./counter-markup.js";

// The child placement's envelope, as the composer puts it where the directive stood.
const INNER_ENVELOPE = `<assembly-root data-id="b">${counterMarkup("b")}</assembly-root>`;

const outer = (inSlot: string): string =>
  '<article data-hk="a000"><!--$--><div data-hk="a00100" data-assembly-slot="inner" >' +
  inSlot +
  '</div><!--/--><!--$--><button data-hk="a0020" type="button"><!--$-->Outer<!--/--> ' +
  "<!--$-->0<!--/--></button><!--/--></article>";

/** What the server half renders the outer fixture to as placement "a": its slot holds the directive. */
export const OUTER_MARKUP = outer('<assembly name="inner"></assembly>');

/**
 * What the browser half is given to hydrate, once the composer has put the counter placement "b"
 * where the directive stood: two islands whose keys would be the same without their ids.
 */
export const NESTED_MARKUP = outer(INNER_ENVELOPE);
