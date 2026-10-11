# Deploying the AssembleJS page

This folder is the whole site: static pages, fonts and images vendored, nothing from a
third-party CDN. Two of its directories are not committed and are written by the deploy before
it checks and syncs: `kit/`, staged from the platform pin, and `docs/api/`, the API reference,
generated from the packages' sources (both below). `.github/workflows/deploy-site.yml` syncs
`site/` to the shared bucket. Nothing is copied by hand.

**A PUSH THAT TOUCHES `site/` PUBLISHES.** The paths filter is an INCLUDE on `site/**`, never an
ignore list: this repository is a product, so almost everything in it is not the site, and a
filter naming what to skip publishes whatever somebody adds next.

## Two prefixes, one folder

Unlike howland and magpie, this product publishes twice, which is the npm two-channel rule
applied to the site:

- `next` publishes to `/assemblejs/next/`, alongside the `next` dist-tag.
- `main` publishes to `/assemblejs/`, alongside `latest`.

The branch decides the prefix; the folder is identical. **Every link into the next channel
carries its trailing slash**: the CloudFront prefix router redirects a bare FIRST segment only,
so `/assemblejs/next` does not redirect and `/assemblejs/next/` does.

## The kit is referenced, never copied

`site/kit/` is gitignored. The deploy reads the one platform pin, `ayersPlatform` in the root
`package.json`, checks `platform` out at exactly that tag, and stages `sitekit/*.css` into the
upload as `site/kit/`. Locally, symlink it for preview:

    ln -s ../../platform/sitekit site/kit

The landing page is this product's own and does not use the kit; every other page links
`kit/kit.css` first and `skin.css` second, in that order, because the skin overrides.

## The API reference is generated, never committed

`site/docs/api/` is gitignored. `pnpm site:api` runs typedoc, configured by the root
`typedoc.json`, over every entry point the twelve packages publish: each `src/index.ts`, and
each subpath a package's `exports` names. It reads the sources through `tsconfig.typedoc.json`,
whose `references` are the packages' own, so each package is read under its own compiler
options. Each entry file names itself with a `@module` comment, so the reference reads by the
specifier a user imports. `pnpm check:reference`, in `pnpm check`, holds the entry points to the
packages' `exports`, so a subpath published and not documented is refused, and the reverse; and
it generates the whole reference with warnings as errors, so a link in a comment that leads
nowhere fails CI and not the next deploy. `pnpm site:api` alone writes the same tree for a
preview.

The deploy generates it in a job of its own, which installs the workspace, builds the packages
and runs typedoc, and holds no token for the cloud: the pages reach the deploy as an artifact.
The job that assumes the role installs nothing. A run whose packages do not build, or whose
reference did not arrive, stops before the sync.

In `pages.json` the page is declared `generated`, with the note the index for a model lists it
by: the site check does not require it to exist in the tree and does not walk the tree it heads,
which links hundreds of pages of its own. Typedoc links its assets with a query that changes at
each generation, so the week-long asset cache never serves a stale search index after a deploy.

The reference refreshes when the site deploys, and the site deploys on a push that touches
`site/**`. A push that changes only the packages does not republish it; the next site push, or a
manual dispatch, does. Nothing is deleted from the bucket, so the page of a symbol that was
removed stays reachable by its address until the prefix is cleared by hand.

## What is checked before it ships

`scripts/check-site.mjs`, in `pnpm check`:

- Every role the kit consumes is bound by `skin.css`, and each binding satisfies the contrast
  invariant that role carries in `platform/sitekit/ROLES.md`. A role documented only by its name
  is settled by whoever writes the first skin, so the numbers are enforced rather than described.
- Every page `pages.json` declares exists, every required page is declared, and no page links to
  one that is not. A page advertised and missing is a 404 a visitor finds before anyone else. A
  page marked `generated` is exempt from existing in the tree, and the deploy proves it exists
  after fetching it, before this check runs.

## The pages as text

`llms.txt` and `llms-full.txt` are generated from `pages.json` and the pages, never written by
hand: `node scripts/site-llms.mjs` writes them. `pnpm check` holds them, which CI runs beside
the deploy and not before it: a page added, a sentence changed or either file edited is refused
there until the script has been run. The deploy itself does not check them, since the check
needs the workspace installed and the job that holds the role installs nothing. They are
uploaded with the pages' cache, as text in utf-8, and every link in them is relative, because
the folder is published at two addresses.

## The release notes

`release-notes.html` is written by hand, one `<section id="v...">` for each version, newest
first. `scripts/check-release-notes.mjs` holds it to the packages' changelogs in structure
only: a section for each version a changelog heads, once, and none for a version no changelog
has. It needs nothing installed, so the deploy runs it before anything is published, the
release job runs it before a version is, and `pnpm check` runs it too.

## Still the owner's

- **The mark.** `mark.svg` and `favicon.svg` are placeholders and say so in their own source. The
  real one is a bird in the lovebird family, in the geometric genre, in the brand's colours.
- **The palette.** `skin.css` says it is a placeholder. It satisfies every invariant, so
  replacing it is a change with a gate already waiting for it.
- **The PAT.** `RELEASES_PAT` must exist in this repository's secrets before the deploy can check
  the private platform repository out at the pin. Nothing about the site publishes until it does.
- **The OIDC role** `gh-deploy-assemblejs-site`, and the bucket policy for this prefix.
