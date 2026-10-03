// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What the server half renders the counter fixture to with the label "Clicked", as the placement
 * with this id. The server test holds the server half to it and the browser test hydrates it, so
 * the two halves, which run on two builds of Solid, are held to the same markup.
 */
export const counterMarkup = (id: string): string =>
  `<button data-hk="${id}000" type="button"><!--$-->Clicked<!--/--> <!--$-->0<!--/--></button>`;
