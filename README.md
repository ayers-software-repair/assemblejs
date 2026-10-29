# AssembleJS

Compose React, Vue, Svelte, Preact, Solid, Lit, Web Components, and templates in one application.
AssembleJS renders each assembly on the server, places it in a page, and hydrates its browser code.
Assemblies can live in one project or on explicitly configured remote servers.

The MCP development server lets your AI coding agent inspect the project, add and place assemblies,
check project rules, and render the result. New projects include agent instructions and client registrations.
The framework uses the agent and model you already work with.

## Start an application

```sh
npm create @asmjs my-app
cd my-app
npm install
npm run dev
```

Node.js 22 or newer. Add a framework renderer when the project needs it; an application can compose assemblies written in different frameworks on the same page.

## Packages and documentation

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
