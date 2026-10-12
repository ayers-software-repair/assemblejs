// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What the server half renders the steps fixture to with two steps. The element is marked to
 * hold off hydrating until the view has set what it renders from. The server test holds the
 * server half to it and the browser test hydrates it.
 */
export const STEPS_MARKUP =
  '<!--lit-part kzfqR87O9Mo=--><!--lit-node 0--><probe-steps  defer-hydration><template shadowroot="open" shadowrootmode="open"><!--lit-part ds51GhkoObY=--><ol>\n      <!--lit-part--><!--lit-part PuAyB/F8cHw=--><li><!--lit-part-->light<!--/lit-part--></li><!--/lit-part--><!--lit-part PuAyB/F8cHw=--><li><!--lit-part-->dark<!--/lit-part--></li><!--/lit-part--><!--/lit-part-->\n    </ol><!--/lit-part--></template></probe-steps><!--/lit-part-->';
