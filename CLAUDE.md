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

## Organization: seven rules, each with a gate (owner, 2026-09-03)

He asked for one thing per file and clear directories, even where that means many files, because
many small named files read better than few large ones. Every rule below has a tool that refuses
the change; none of them is advice.

1. **One declaration per file, and the filename is the declaration**, kebab-cased.
   `assembly-request.ts` exports `AssemblyRequest` and nothing else.
2. **Every directory has an `index.ts` that only re-exports.** It declares nothing of its own.
3. **`src/index.ts` re-exports the child directory indexes**, never a leaf file. A directory that
   is its own published entry point is absent from it, because a thing published twice can drift.
4. **A sibling imports the leaf file, never an index.** An index is for consumers of the
   directory, not for the code inside it. This is what makes an index cycle impossible and what
   makes the dependency graph true.
5. **`test/` mirrors `src/` exactly**: one test file per source file, same path, `.test.ts`.
6. **No `utils`, `helpers`, `common` or `misc` directory.** A file lands in the directory that
   owns its concept; if no directory owns it, the concept is missing, not the file.
7. **300 lines is the hard ceiling.** A file that needs the word "and" to describe it is two.

Enforced, and every one of these is a script in `pnpm check` rather than a claim in this file:
`check:organization` (rules 1-4, 6, 7, read off the TypeScript AST), `check:mirror` (rule 5),
`check:modules` (dependency-cruiser: no cycles, no orphans, layer direction), `lint` (eslint,
import order and kebab filenames), `check:unused` (knip: a file or export nothing reads),
`check:versions` (syncpack: one version of a dependency across the workspace), `check:exports`,
`check:pack` and `check:publish` (publint and are-the-types-wrong on the real tarball).

Every gate that can go red on a known-bad input has been watched doing so, and the ones with a
`--self-test` run it immediately before they are trusted. This paragraph is checked against
`package.json`: a gate named here that is not in the `check` chain is a false claim, which is
what this list was the first time it was written.

## Release

changesets. `pnpm changeset` on any `packages/*/src` change. Publishing is CI only through
`release.yml`'s `release` environment (npm trusted publishing); nobody runs `npm publish` from
a laptop and there is no npm token anywhere.

## How this repository is worked (owner's standing rules, 2026-09-03)

- NOTHING LIVES IN A SESSION'S MEMORY. A fact is a fact only once it is in a file here: a rule in
  this document, a decision in `docs/DECISIONS.md`, a read in `docs/dossiers/`, a task in
  `docs/TODO.md`. A session that ends takes nothing with it.
- CHECK THE FILE, NEVER ASSUME. Before stating what a file, a flag, a version or a route does,
  open it. A claim with no read behind it is a defect, not a shortcut.
- THE TODO LIST IS KEPT LIKE A LEDGER. `docs/TODO.md` holds every task; do the task, check it off
  in the same commit, never in a batch afterwards. An unchecked box is work not done.
- THE PLAN GOVERNS. `docs/PLAN.md` is the implementation plan and the bite ladder. Do not stray
  from it. When something unexpected forces a change: fix it, log it in `docs/DECISIONS.md` with
  what was expected and what was found, raise it with the owner only if the change alters the
  plan's shape, then pivot and continue.
- AUTONOMOUS BY DEFAULT. Work runs without asking. Stop for the owner only when the plan itself
  must change, never for permission to continue.
- EVERY GATE IS RUN, NOT ASSUMED. A rung is done when its proof command has been run in this
  session and its output pasted; a green diff proves nothing.
- A PROBE IS WATCHED FAILING BEFORE IT IS TRUSTED. A check that has never gone red on a known-bad
  input is not a check.
- EVERY RUNG IS VERIFIED BY A SEPARATE AGENT (owner, 2026-09-03: "always use a verification
  subagent to verify your work"). When a rung's own proof is green, a fresh reader with no stake
  in the work checks it at the source: that the gates actually gate, that the claims in the commit
  match the tree, that nothing was asserted from a diff. Its findings are fixed before the rung is
  reported done. A self-verified rung is an unverified rung.
- TRIPLE-CHECK IN FULL (owner, 2026-09-03). Read the whole thing, not the part that changed.

## After a restart

Re-read this file, then `docs/TODO.md` for where the work is, `docs/PLAN.md` for what governs it,
and `docs/DECISIONS.md` for what is already settled, before writing code.

## Tooling — the global rules apply here (see ~/.claude/CLAUDE.md)

Two laws from the root file bind every session in this repo. They are not repeated in full here on
purpose: a long CLAUDE.md gets ignored in the middle, so this is a pointer, not a copy.

1. **CONSULT THE DOCS, NEVER GUESS.** Any claim about a library, framework, SDK or platform gets
   read from the real documentation first — `context7` for libraries, `microsoft-docs` for
   .NET/Windows/Azure. Cite the source. Never from memory.
2. **Reach for the tool before the generic one.** `serena` for "where is this symbol used" before
   grep; the LSP for definitions and references; `playwright` for a real browser (this box needs
   `--no-sandbox` and `--mute-audio`).

This repo is **TypeScript** — `typescript-language-server` applies.
