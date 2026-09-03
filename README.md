# AssembleJS

An assembly is a piece of a web page written in one UI framework: React, Vue, Svelte, Preact,
Solid, Lit, a web component, or a plain template. AssembleJS composes assemblies into pages on
the server, whether they live in the same project or on another server, and hydrates them in
the browser, so a team can hire any kind of frontend developer and have them building on day
one, in the framework they already know, on the same page as everyone else.

It also ships an MCP server, so an AI agent builds with the framework the way a developer does,
with the framework's own knowledge behind it: it can read the project's shape, add an assembly,
place it on a page, and then render and compose to see what it actually produced. The server
carries no model and no credential of its own; the intelligence is whichever agent you already
use.

Status: under construction on the `next` branch. Nothing is published yet.

- Packages: `@assemblejs/core`, `@assemblejs/cli`, `@assemblejs/create`, `@assemblejs/devtools`,
  one `@assemblejs/renderer-*` package per framework.
- Command: `assemblejs` (alias `asm`): `new`, `add`, `dev`, `build`, `check`, `deploy`.
- Docs: https://ayers.repair/assemblejs/docs/
- License: Apache-2.0. See LICENSE and NOTICE.

Contributing: read CONTRIBUTING.md first; every pull request references an accepted issue.
Security: SECURITY.md. Conduct: CODE_OF_CONDUCT.md.

Published by Ayers Electronics.
