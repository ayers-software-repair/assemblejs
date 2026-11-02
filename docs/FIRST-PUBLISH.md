# npm publication and trusted publishers

All fourteen existing package names were present on the public npm registry on 29 October 2026,
with `latest` and `next` both pointing to `1.0.0-next.0`. This is publication evidence, not proof
that their trusted-publisher configurations are active. Do not repeat their first publication.

The existing `release.yml` publishes an owner-approved tag through OIDC, then deploys the site
from the same commit. Each npm package needs its own trusted-publisher entry. The owner reviews
and saves account settings, handles second-factor authentication, and authorizes release tags.
Do not replace a working publisher or token path without reading its current configuration.

The first-publication procedure below applies only when a **new package name** is added. npm
requires the package to exist before its trusted publisher can be configured. The release guard
fails with an exact hand-publication command for an unseen name; an outage is not treated as 404.

The fourteen names: `@asmjs/build`, `@asmjs/check`, `@asmjs/cli`, `@asmjs/core`,
`@asmjs/create`, `@asmjs/devtools`, `@asmjs/mcp`, `@asmjs/renderer-lit`,
`@asmjs/renderer-preact`, `@asmjs/renderer-react`, `@asmjs/renderer-solid`,
`@asmjs/renderer-svelte`, `@asmjs/renderer-templates`, `@asmjs/renderer-vue`.

## Before you start

Use Node.js 22.14 or newer and npm 11.15 or newer for the trust-management commands. Confirm
two-factor authentication on the intended company npm account. The owner runs:

    npm install -g npm@11
    npm login

## First publication of a new name

Skip this section for the existing fourteen names. Begin in a clean checkout of the actual
repository; do not switch or discard another session's working changes.

1. **Use the prepared commit with green hosted CI.** Verify its identity before building:

       git rev-parse HEAD

   It must equal the reviewed release commit. This procedure does not choose a version or
   authorize a release.

2. **Build it once:**

       pnpm install --frozen-lockfile && pnpm build

3. **Print the publish commands.** It fails on purpose, listing one command per unpublished
   name:

       node scripts/first-publish.mjs next

   Each command packs the package with pnpm and publishes the tarball with npm, for example:

       (cd packages/create && pnpm pack && npm publish ./asmjs-create-<version>.tgz --access public --tag next --provenance=false && rm asmjs-create-<version>.tgz)

4. **Publish only the unseen names printed by the guard.** The owner runs each exact command
   and completes npm authentication. Never republish an existing version.

5. **Read back the new package's dist-tags.** Do not assume what `latest` became from the
   requested `--tag`, or infer that a stable release shipped. The current npm CLI sends the
   requested tag in its publish metadata; that source does not prove an undocumented registry
   first-publication override. This procedure does not assert that every first publish takes
   `latest` regardless of `--tag`. Inspect the actual registry result. `npm create @asmjs`
   without a version resolves the `latest` tag of `@asmjs/create`.

6. **Confirm every name is on npm:**

       node scripts/first-publish.mjs next

   It ends with `every name is on the registry; trusted publishing publishes`.

7. **Only with release authorization, cut the matching tag.** The release run skips versions
   already on npm and publishes any other prepared versions through their trusted publishers,
   then deploys the site:

       git tag -a v<version> -m v<version>
       git push origin v<version>

   Verify the run and the public artifacts before considering publication complete.

## Installation tags and staged placeholders

The issue37 guard runs read-only in CI, including when source CI proof is reused:

    node scripts/check-dist-tags.mjs --self-test && node scripts/check-dist-tags.mjs

For each public package it reads public npm `dist-tags` and `versions`. Before any stable
release, both `next` and `latest` must identify the highest published `X.Y.Z-next.N`.
Once any stable `X.Y.Z` exists, `latest` must identify the highest stable version;
`next`, when next versions exist, must identify their highest version. The `0.0.0-stage`
placeholder is not stable. Valid build metadata does not change precedence; an already tagged
equal-highest build variant is retained. Version ordering is numeric, not lexical. This follows this
repository's release-channel format; other prerelease channels do not choose these tags.

After the existing authorized publish step, release.yml uses npm11.21+ and explicitly permits
only pre-stable `latest` repair. It validates the local tagged version was published, refuses
repair if `next` is wrong, re-observes before writing and reads the result back afterward.
It never automatically moves `latest` once stable exists. Reads are observations, not an
atomic registry lock. A failed/ambiguous write or failed readback fails the release, prints
the operator command derived from the final observed policy and prevents the dependent site
job. If readback is unavailable or already correct under a changed policy, guidance requires
fresh read-only inspection before any further write. It never recommends the old prerelease
move after observing stable. No automatic write retry.

OIDC dist-tag operations require npm11.21+ (or12.2+) and the trusted publisher's separate
**Allow npm dist-tag** permission, disabled by default. Direct publish permission does not
imply it. The guard attempts the actual operation only in the existing tagged release
workflow; if unsupported or refused, it fails with the operator command. No token is added.
The owner decides and changes publisher permissions; this document does not authorize that.
The commands are supported by current npm docs, not proof that this account is configured.

For a new name, `npm stage publish` creates a publicly available `0.0.0-stage` placeholder;
the staged version's contents remain unavailable until explicit approval. Staged publishing
requires npm11.15+ and Node22.14+. It is not used by this release workflow and is not a
name-reservation-only dry run. Do not stage a package to probe ownership or remove/deprecate
existing placeholders without the separate issue38 owner decision. E404 from a public read
is neither ownership nor publication authorization; the issue40 new-name boundary remains.

Issue36's registry mismatch was verified red, then corrected by the owner on 2 November.
Fresh reads confirm all 14 packages have latest=next=`1.0.0-next.2`, and the default scoped
starter resolves that version and generates matching project pins. CI `41386333457` retains
the original failure; only failed ci-ready was rerun after the registry changed, and passes.
Evidence is retained in AUDIT `925c9c200`. No new version was published or publisher setting
changed. A red live gate still blocks delivery; it never authorizes bypassing the invariant.
Fixture success and a manual correction do not prove an actual OIDC repair. That requires a
separately authorized release and its readback.

## Hand over to trusted publishing

Prepare the next checked version first. Under npm's current rules, a newly created trusted
publisher must complete its first successful publish within two days. The owner saves each
entry only when ready to carry out the authorized release.

Every entry uses GitHub owner `ayers-software-repair`, repository `assemblejs`, workflow
filename `release.yml`, environment `release`, and direct `npm publish` permission. The
workflow already uses a GitHub-hosted runner and `id-token: write`. Do not create an npm token.

8. **Read existing publisher entries, then add the required mappings.** The owner runs these
   commands, or saves the equivalent package-settings forms, and completes any authentication:

       npm trust github @asmjs/build --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/check --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/cli --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/core --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/create --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/devtools --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/mcp --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/renderer-lit --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/renderer-preact --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/renderer-react --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/renderer-solid --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/renderer-svelte --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/renderer-templates --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish
       npm trust github @asmjs/renderer-vue --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish

9. **Run the authorized trusted release within the two-day window.** Verify the exact npm
   versions, archive integrity, provenance and successful release workflow for every package
   before changing an existing working authentication path.

10. **Then restrict token publishing.** After the trusted release is verified, the owner opens
    each package's Settings, Publishing access, and chooses "Require two-factor authentication
    and disallow tokens". Trusted publishing is unaffected. Read back the saved setting.

## Why the command is shaped this way

- `pnpm pack`, not `npm publish` from the folder: pnpm's pack writes real versions where the
  workspace says `workspace:*`; npm's pages never mention that protocol.
- `--tag next`: npm refuses a prerelease without a tag.
- `--provenance=false`: provenance can only be made on a supported cloud CI runner, and the
  packages set `publishConfig.provenance`. A flag on the command line replaces that key. Your
  first versions carry no provenance; every later one does.
- `--access public`: a new scoped package defaults to public, and the packages say so too.
- No `--otp`: npm prompts for the code when the registry asks for it.

## Sources

- `workspace:` replaced "through `pnpm pack` or one of the publish commands like `pnpm
publish`": https://pnpm.io/workspaces
- "You must specify a tag using --tag when publishing a prerelease version", and "Filter out
  properties set in CLI flags to prioritize them over corresponding `publishConfig` settings":
  https://github.com/npm/cli/blob/latest/lib/commands/publish.js
- Provenance needs "a supported cloud CI/CD provider using a cloud-hosted runner", and trusted
  publishing makes it automatically: https://docs.npmjs.com/generating-provenance-statements
- `--access` is "'public' for new packages"; `--otp`: "npm will prompt on the command line for
  one": https://docs.npmjs.com/cli/v11/commands/npm-publish
- The package must already exist; npm 11.15+ and package write permission are required for
  `npm trust`; command flags and current account prerequisites:
  https://docs.npmjs.com/cli/v11/commands/npm-trust
- A new trusted publisher must publish within two days; disallowing tokens:
  https://docs.npmjs.com/trusted-publishers

Re-read the current npm settings before changing them. The npm-trust CLI page and the main
trusted-publisher page describe different limits on the number of connections; neither is
permission to revoke an existing connection. Read-back, provenance and the successful workflow
are required evidence. The 29 October registry check above does not establish those settings.

Additional source reads for issue37 (1 November 2026):

- OIDC dist-tags, minimum CLI and default-off permission:
  https://docs.npmjs.com/trusted-publishers/#managing-dist-tags-with-trusted-publishing
- The CLI exchanges OIDC credentials for dist-tag operations:
  https://github.com/npm/cli/blob/latest/lib/commands/dist-tag.js
- The publish library writes the requested tag into metadata; it does not establish a universal
  server-side first-publication override:
  https://github.com/npm/cli/blob/latest/workspaces/libnpmpublish/lib/publish.js
- New-name public placeholder and approval boundary:
  https://docs.npmjs.com/staged-publishing/

- Version precedence and ignored build metadata: https://semver.org/#spec-item-10
