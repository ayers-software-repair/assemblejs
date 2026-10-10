// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * A page's whole document as the starter writes one: what every page needs and nothing a page
 * did not ask for, titled with a name, and placing in its body the assemblies it is given,
 * each by the directive, in the order given.
 */
export function pageDocument(title: string, placed: readonly string[] = []): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
${placed.map((name) => `    <assembly name="${name}"></assembly>\n`).join("")}  </body>
</html>
`;
}
