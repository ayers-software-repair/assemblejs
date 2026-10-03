// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What the server half renders the counter fixture to with the label "Clicked". The server test
 * holds the server half to it and the browser test hydrates it, so the two halves, which run on
 * two builds of Solid, are held to the same markup.
 */
export const COUNTER_MARKUP =
  '<button data-hk="000" type="button"><!--$-->Clicked<!--/--> <!--$-->0<!--/--></button>';
