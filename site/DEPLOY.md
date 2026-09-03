# Deploying the AssembleJS page

This folder is the whole site: static pages, no build step, no CDN, fonts and images vendored.
`.github/workflows/deploy-site.yml` syncs `site/` to the shared bucket. Nothing is copied by hand.

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

## What is checked before it ships

`scripts/check-site.mjs`, in `pnpm check`:

- Every role the kit consumes is bound by `skin.css`, and each binding satisfies the contrast
  invariant that role carries in `platform/sitekit/ROLES.md`. A role documented only by its name
  is settled by whoever writes the first skin, so the numbers are enforced rather than described.
- Every page `pages.json` declares exists, every required page is declared, and no page links to
  one that is not. A page advertised and missing is a 404 a visitor finds before anyone else.

## Still the owner's

- **The mark.** `mark.svg` and `favicon.svg` are placeholders and say so in their own source. The
  real one is a bird in the lovebird family, in the geometric genre, in the brand's colours.
- **The palette.** `skin.css` says it is a placeholder. It satisfies every invariant, so
  replacing it is a change with a gate already waiting for it.
- **The PAT.** `RELEASES_PAT` must exist in this repository's secrets before the deploy can check
  the private platform repository out at the pin. Nothing about the site publishes until it does.
- **The OIDC role** `gh-deploy-assemblejs-site`, and the bucket policy for this prefix.
