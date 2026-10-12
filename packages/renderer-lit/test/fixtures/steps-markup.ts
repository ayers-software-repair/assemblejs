// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * What the server half renders the steps fixture to with two steps. Each element is marked to
 * hold off hydrating until the view has: the one the view gives a list, and the one it gives
 * nothing. The server test holds the server half to it and the browser test hydrates it.
 */
export const STEPS_MARKUP =
  '<!--lit-part ND5+oIwi1vI=--><!--lit-node 0--><probe-steps  defer-hydration><template shadowroot="open" shadowrootmode="open"><!--lit-part ds51GhkoObY=--><ol>\n      <!--lit-part--><!--lit-part PuAyB/F8cHw=--><li><!--lit-part-->light<!--/lit-part--></li><!--/lit-part--><!--lit-part PuAyB/F8cHw=--><li><!--lit-part-->dark<!--/lit-part--></li><!--/lit-part--><!--/lit-part-->\n    </ol><!--/lit-part--></template></probe-steps\n    ><probe-count defer-hydration><template shadowroot="open" shadowrootmode="open"><!--lit-part Y5Pxk8yzEWk=--><!--lit-node 0--><button type="button" ><!--lit-part-->0<!--/lit-part--></button><!--/lit-part--></template></probe-count><!--/lit-part-->';
