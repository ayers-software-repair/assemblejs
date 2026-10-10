// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { pageDocument } from "@assemblejs/cli";
import { SEGMENT } from "@assemblejs/core";
import type { AgentPrompt } from "./agent-prompt.js";

/** Making a page: its directory and whole document, what it places, and what it declares. */
export const MAKE_PAGE_PROMPT: AgentPrompt = {
  name: "make_page",
  title: "Make a page",
  description:
    "Makes a page from the document a new project's page is written with, places what belongs on it, and composes it.",
  arguments: [
    {
      name: "name",
      description: "the page's name, which is its directory and, but for home, its address",
      required: true,
      accepts: SEGMENT,
    },
  ],
  brief: ({ name = "" }) => {
    const route = name === "home" ? "/" : `/${name}`;
    return `Make a page named "${name}", served at ${route}.

1. A page is a directory. If src/pages/${name} exists, say so and stop.
2. Write src/pages/${name}/${name}.html, the page's whole document, starting from this:

\`\`\`html
${pageDocument(name)}\`\`\`

3. Place on it what belongs there, in the order it should stand: for each assembly, call place_assembly with { "page": "${name}", "name": the assembly's name }. If you were not told what belongs on it, read the resource assemblejs://project for the assemblies that exist, and ask.
4. A page served somewhere other than ${route}, a deadline or a fallback for one of its placements, and a stream are each declared in src/pages/${name}/${name}.page.ts, whose default export is definePage({ ... }) from "@assemblejs/core". Write that file only when the page needs one of them.
5. See it: read the template and call compose_page with { "template": the file's text }. Read the account of each placement and not only the markup: a placement that fell back looks the same in the markup as one that worked.
6. Call check, and fix every finding before you call this done.
`;
  },
};
