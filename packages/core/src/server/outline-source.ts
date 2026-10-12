// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { OUTLINE_ROUTE } from "../vocab/outline-route.js";

/**
 * The script a page links to draw its outline, served as a file because the page's policy runs
 * no inline script: it imports the module that draws it, from this server, and starts it.
 */
export const OUTLINE_SOURCE = `import { outline } from ${JSON.stringify(OUTLINE_ROUTE.module)};
outline();
`;
