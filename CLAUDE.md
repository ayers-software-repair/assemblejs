# AssembleJS

Server-composed micro-frontend framework. pnpm workspace monorepo, ESM only, Node 22 or newer,
Apache-2.0. An assembly is a piece of UI written in one framework; pages are composed from
assemblies on the server, locally or from other servers over HTTP, and hydrated in the browser.
Do not reduce it to "just SSR"; the composition model is the product.

## Words (fixed; the README defines them, code and docs use them exactly)

page, assembly (subassembly when nested; a URL means it lives on another server), service (the
server-side data step), api (raw-data endpoint), server (the runtime, `createServer()`), events
(the browser wiring), `assemblejs.config.ts`, template, manifest (the server-to-server handshake
only). CLI bin `assemblejs`, alias `asm`; verbs new, add, dev, build, check, deploy.

## Packages

- `@assemblejs/core`: server, declaration types, HTML and WebComponents renderers.
- `@assemblejs/cli`, `@assemblejs/create`, `@assemblejs/devtools`.
- `@assemblejs/renderer-templates` (EJS, Markdown, Nunjucks, Handlebars, Pug; no peer deps).
- `@assemblejs/renderer-{preact,react,vue,svelte,solid,lit}`: one real peer dependency each.

## Identity: hard law, enforced by CI, not a style preference

None of the legacy names (the old package name, the old handle, the retired brand) and no
personal mail address anywhere in the tree; the exact pattern lives in `scripts/identity-gate.sh`
and is deliberately not repeated here, because a check that finds prose finds itself.
No author line in source files; author credit is root `package.json` `author` only. Publisher is
Ayers Electronics on every metadata surface; the GitHub organization name appears in no
package.json. Every `packages/*/src/**/*.ts` opens with:
// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
`scripts/identity-gate.sh` and `scripts/check-headers.mjs` enforce this; treat a red as a stop.

## Commands

    pnpm install
    pnpm check            # identity, headers, lint, typecheck, test, build, pack: what CI runs
    pnpm --filter @assemblejs/core dev

## Rules that are hooks, not requests (.claude/hooks/)

- `packages/*/dist/**` and `pnpm-lock.yaml` are machine-written; a PreToolUse hook blocks edits.
- Every edited `.ts`/`.tsx` is reformatted by Prettier after the edit.
- A session does not end on a red typecheck or test; the Stop hook refuses and prints the failure.

## Contribution shape (CONTRIBUTING.md holds the rules; do not restate them in code)

No pull request without an `accepted` issue except one-line fixes. DCO sign-off on every commit
(`git commit -s`). Conventional commit messages. No other attribution trailer, ever. Squash merge.

## Style

No emojis anywhere: code, docs, commits, comments. Comments explain behaviour, never history.
No `any`. No console.log in packages. No legacy or compatibility paths: the product ships clean.

## Release

changesets. `pnpm changeset` on any `packages/*/src` change. Publishing is CI only through
`release.yml`'s `release` environment (npm trusted publishing); nobody runs `npm publish` from
a laptop and there is no npm token anywhere.

## After a restart

Re-read this file, then `docs/HANDOFF.md` and `WORKING.md`, then the dossier in `docs/dossiers/`
for the subsystem in scope, before writing code.
