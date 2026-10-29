# AssembleJS

An assembly is a piece of a web page written in one UI framework: React, Vue, Svelte, Preact,
Solid, Lit, a web component, or a plain template. AssembleJS composes assemblies into pages on
the server, whether they live in the same project or on another server, and hydrates them in
the browser, so a team can hire any kind of frontend developer and have them building on day
one, in the framework they already know, on the same page as everyone else.

It also ships an MCP server, so an AI agent builds with the framework the way a developer does,
with the framework's own knowledge behind it: it can read the project's shape, add an assembly,
place it on a page, check its work against the framework's own rules, and render an assembly or
compose a page to see what it actually produced: any view while the project's dev server runs,
plain html with nothing running. The server
carries no model and no credential of its own; the intelligence is whichever agent you already
use. Every new project is written with an `AGENTS.md` that says what it is and the rules its
code must satisfy, and with that server installed and registered for Claude Code, Cursor,
VS Code, Gemini CLI and opencode, so an agent that opens the project knows the framework before
it writes.

Status: under construction on the `next` branch. Nothing is published yet.

- Packages: `@asmjs/core`, `@asmjs/build`, `@asmjs/check`, `@asmjs/cli`,
  `@asmjs/create`, `@asmjs/devtools`, `@asmjs/mcp`, one `@asmjs/renderer-*`
  package per framework.
- Command: `assemblejs` (alias `asm`): `new`, `add`, `dev`, `build`, `check`, `perf`, `deploy`.
- Docs: https://assemblejs.com/docs/
- The same pages for a model to read: https://assemblejs.com/llms.txt
- License: Apache-2.0. See LICENSE and NOTICE.

Contributing: read CONTRIBUTING.md first; every pull request references an accepted issue.
Security: SECURITY.md. Conduct: CODE_OF_CONDUCT.md.

Published by Ayers Electronics.

## Verification

Pull requests run the complete check matrix on GitHub: Node 22 and 24, browser proof,
packed conformance, examples and commit checks. A local full suite is not a prerequisite.
An unchanged pull request can reuse complete trusted push proof; missing or invalid proof
runs the full matrix. Main-merge proof reuse is not enabled by this change.

For an explicitly needed local diagnosis, `verification.json` runs the source-header check
before `pnpm check`, with resource limits and package `dist/` outputs retained for its
receipt. Test counts come from command output; the plan declares no synthetic count.
When the platform verifier is available in `_platform`, its invocation is:

```sh
node _platform/codestyle/scripts/verify.mjs --plan verification.json --out /tmp/assemblejs-verification
```
