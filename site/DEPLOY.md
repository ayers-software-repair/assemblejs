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

The product's two release channels use the same site folder:

- `next` publishes to `/assemblejs/next/`, alongside the `next` dist-tag.
- `main` publishes to `/assemblejs/`, alongside `latest`.

These prefixes are also served at `https://assemblejs.com/next/` and
`https://assemblejs.com/`. The domain's distribution and the company distribution share the
same bucket. The workflow invalidates both after uploading.

## A release tag publishes the package and its site

Versions and release notes are prepared in a normal commit; branch pushes do not publish npm.
The owner cuts `v1.0.0-next.N` from `next` or `v1.0.0` from `main` after versioning, release notes
and that commit's CI pass. `release.yml` verifies that every public package matches the tag,
that Changesets' prerelease mode matches its channel, and that the commit belongs to the right
branch. The `release` environment identifies npm publication through trusted publishing.

After npm succeeds, that same run calls `deploy-site.yml` with the release's exact commit and
channel. A failed npm publication cannot deploy the release's site. There is no separate
release-listener workflow. A rerun uses the same tag and commit; it does not take newer branch
contents. The release does not commit changes back, create another tag, or open a version
pull request. It needs no permission to create or approve pull requests. The existing site-only
push and manual deployment paths remain available.

The first publication still requires the owner's npm package/bootstrap and trusted-publisher
setup. A site deployment alone does not establish that npm publication is configured or complete.

Relative navigation works at both prefixes. Deployment generates canonical and Open Graph
addresses and `sitemap.xml` for `https://assemblejs.com/`. Candidate pages at
`https://assemblejs.com/next/` carry `noindex, follow` and are excluded from the sitemap.
The shared metadata build emits `robots.txt`, published at the domain root by either channel,
pointing to the final stable sitemap. That sitemap is supplied by the stable deployment.
Social previews use `site/social.png`, the existing composition mark rasterized at 512 by 512
with `rsvg-convert -w 512 -h 512 site/mark.svg -o site/social.png`; update it with the source mark.
The same files also serve the company subpaths. Domain activation remains a launch operation;
a prepared site does not itself enable the domain. **Every link into the next channel
carries its trailing slash**: the CloudFront prefix router redirects a bare FIRST segment only,
so `/assemblejs/next` does not redirect and `/assemblejs/next/` does.

## The kit is referenced, never copied

`site/kit/` is gitignored. The deploy reads the one platform pin, `ayersPlatform` in the root
`package.json`, checks `platform` out at exactly that tag, and stages the public CSS, four landing modules, download controls and icons into
`site/kit/`. This private checkout occurs only in the deployment job, using its existing
credential. Public builds and pull-request checks need no platform access. Locally, symlink it
for preview. The same platform pin also governs `.editorconfig` and the commit rule in
`scripts/house`; their drift checks remain part of the normal gate:

    ln -s ../../platform/sitekit site/kit

Every page uses the same product frame, including the landing and generated API reference.
`skin.css` binds the brand roles; `kit/product.css`, `kit/landing.css` and `kit/docs.css` own the
layout, and `landing-brand.css` holds product-specific refinements. Templates, tests and the
private metadata build utility are not public assets. The checked-in platform pin must name a
release containing these files before the adoption is pushed; a local preview symlink is not a
published dependency.

## The API reference is generated, never committed

`site/docs/api/` is gitignored. `pnpm site:api` runs typedoc once per package (the root
`typedoc.json`'s `packages` strategy), each package's own `typedoc.json` naming the entry points
it publishes: `src/index.ts`, and each subpath its `exports` names. Each package is read through
its own `tsconfig.json`, and typedoc's check that a public signature names no unexported type
holds within it, which one run over the twelve would have passed. Each entry file names itself
with a `@module` comment, so the reference reads by the specifier a user imports. `pnpm check:reference`, in `pnpm check`, holds the entry points to the
packages' `exports`, so a subpath published and not documented is refused, and the reverse; and
it generates the whole reference with warnings as errors, so a link in a comment that leads
nowhere fails CI and not the next deploy. `pnpm site:api` alone writes the same tree for a
preview. `scripts/site-api-theme.mjs` reads the maintained homepage header/footer and uses the
same navigation generator as authored pages, while retaining TypeDoc search and symbol navigation.

The deploy generates it in a job of its own, which installs the workspace, builds the packages
and runs typedoc, and holds no token for the cloud: the pages reach the deploy as an artifact.
The job that assumes the role installs nothing. A run whose packages do not build, or whose
reference did not arrive, stops before the sync.

In `pages.json` the page is declared `generated`, with the note the index for a model lists it
by: the site check does not require it to exist in the tree and does not walk the tree it heads,
which links hundreds of pages of its own. Typedoc links its assets with a query that changes at
each generation, so a cached search index is not reused after a deploy. HTML, CSS and JavaScript use
a five-minute cache; fonts and images use seven days.

The reference refreshes on every site deployment: a site push, a successful tagged package
publication, or a manual dispatch. A package-only branch push does not republish it.
Only `docs/api/` is mirrored with deletion, after upload, so removed symbols do not retain stale
reference pages. The containing product prefix and its nested candidate channel are never mirrored
with deletion. The 404 page uses origin-relative URLs set from the selected upload prefix,
so its styles and recovery links work even when the missing URL is deeply nested.

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
