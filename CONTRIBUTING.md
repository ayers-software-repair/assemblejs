# Contributing to AssembleJS

Never let an AI speak for you. Never let an AI think for you.

## Before you write any code

Every pull request references an issue a maintainer has labeled `accepted`. This is not a
formality: it is how a small team stays reachable under AI-scale pull-request volume.

- A pull request against no accepted issue is closed unread, with a link to this section.
- Open an issue first. Describe the problem, not the diff. A maintainer labels it `accepted`
  or closes it with a reason before any code is welcome.
- The one exception is a small, obvious fix (a typo, a broken link, a failing test with an
  unambiguous cause). Name the file and line in the pull request instead of an issue.

## Developer Certificate of Origin

Every commit carries a `Signed-off-by` trailer. `git commit -s` adds it. It certifies that you
have the right to submit the code under Apache-2.0; it is not a copyright transfer. Pull
requests with unsigned commits are blocked by CI.

## AI-assisted contributions

AI-assisted code is held to the same bar as any other code: readable, tested, attached to an
accepted issue. Disclose it by checking the box in the pull request template. A real person must
open the pull request, fill in the template, and answer review. A pull request that appears
fully automated and is not confirmed by a person is labeled `maybe-automated` and closes after
24 hours. Undisclosed AI-assisted work found later is closed and may be reopened with disclosure;
a pattern of non-disclosure ends in a block. Boilerplate that restates the issue without working
code or a test that exercises the change is closed regardless of disclosure.

## Paid review

A maintainer may run an AI review on a pull request only by posting an explicit `/review`
comment, and only on a pull request opened by a repository collaborator. Nothing runs
automatically on outside pull requests. Maintainers review those by hand.

## Local setup

    pnpm install
    pnpm check

Node 22 or newer. pnpm only; `.npmrc` sets `engine-strict`. The `check` script runs the same
commands CI runs, in the same order; a red `check` is not pushed.

## Making a change

1. `pnpm changeset` for any change under `packages/*/src`; docs and CI changes need none.
2. `pnpm check` green locally.
3. Conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`), enforced on commit. No
   attribution trailers of any kind other than `Signed-off-by`.
4. Squash merge only; the pull request title becomes the commit message.

## Code of Conduct

This project follows the Contributor Covenant. See CODE_OF_CONDUCT.md.
