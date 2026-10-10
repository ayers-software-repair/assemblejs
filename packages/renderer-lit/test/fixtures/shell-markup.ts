// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const DIRECTIVE = '<assembly name="inner"></assembly>';

/**
 * What the server half renders the shell fixture to: its slot holds the directive, inside the
 * markers of the part Lit rendered it in. The server test holds the server half to it, and the
 * browser test hydrates what the composer makes of it.
 */
export const SHELL_MARKUP =
  '<!--lit-part XgpTiMq5HE0=--><section>\n    <!--lit-node 1--><button type="button" >shell</button>\n    <!--lit-part o519UUigy2g=-->' +
  DIRECTIVE +
  "<!--/lit-part-->\n  </section><!--/lit-part-->";

/** The shell's markup once the composer has put a child where the directive stood. */
export const shellHolding = (child: string): string => SHELL_MARKUP.replace(DIRECTIVE, child);
