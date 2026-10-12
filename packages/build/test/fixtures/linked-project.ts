// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * What stands outside a project in these specs. Every file says SECRET, or names an assembly
 * `secret-...`, so one search of anything read from the project finds whatever came from here.
 */
const OUTSIDE: Readonly<Record<string, string>> = {
  "secret.page.ts":
    'export default { route: "/SECRET-ROUTE", place: { cart: { fallback: "<p>SECRET-POLICY</p>" } }, stream: "/api/SECRET-STREAM" };',
  "broken.page.ts": 'export default { route: "/SECRET-UNFINISHED',
  "secret.api.ts": 'export default { path: "/api/SECRET-PATH", method: "SECRET-METHOD" };',
  "secret.config.ts": 'export default { contentSecurityPolicy: "SECRET-CSP" };',
  "pagedir/landing.html": '<main><assembly name="secret-placed"></assembly></main>',
  "pagedir/landing.page.ts": 'export default { route: "/SECRET-LANDING" };',
  "asm/stolen.html": '<p>SECRET-VIEW</p><assembly name="secret-child"></assembly>',
  "asm/stolen.css": "p { background: url(SECRET-IMAGE.png); }",
  "secret.ejs": "<p>SECRET-TEMPLATE <%= data.missing( %></p>",
  "secret.css": "p { color: SECRET-COLOUR",
  "row.tsx":
    'import { Slot } from "@assemblejs/renderer-react/client";\nexport const Row = () => <Slot name="secret-slot" />;',
  "note.md": "SECRET-NOTE\n",
  "shadowed.lit.ts":
    'export const shadow = true;\nexport const mount = "SECRET-MOUNT";\nexport default () => null;',
};

const tree = (prefix: string, files: Readonly<Record<string, string>>): string => {
  const root = mkdtempSync(join(tmpdir(), prefix));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
};

/**
 * A project of these files with these links in it, beside a directory outside it that holds
 * OUTSIDE. A link's target that begins `outside:` is a path in that directory; any other is
 * written as given, so `../shared/x.ts` stays inside the project. A link takes the place of
 * whatever file or directory was written at its path.
 */
export function linkedProject(
  files: Readonly<Record<string, string>>,
  links: Readonly<Record<string, string>>,
): { readonly root: string; readonly outside: string } {
  const outside = tree("outside-", OUTSIDE);
  const root = tree("linked-", files);
  for (const [link, target] of Object.entries(links)) {
    rmSync(join(root, link), { recursive: true, force: true });
    mkdirSync(dirname(join(root, link)), { recursive: true });
    symlinkSync(
      target.startsWith("outside:") ? join(outside, target.slice("outside:".length)) : target,
      join(root, link),
    );
  }
  return { root, outside };
}
