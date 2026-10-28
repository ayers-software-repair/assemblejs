# The first publish of the @asmjs packages

None of the fourteen names is on npm yet. npm lets a trusted publisher be set only on a package
that already exists, so you publish each name once by hand, with your second factor. Then you
add the trusted publishers, and from then on the release run publishes every tag with no npm
token at all. Until a name is on npm, the release run fails and prints the command for it.

The fourteen names: `@asmjs/build`, `@asmjs/check`, `@asmjs/cli`, `@asmjs/core`,
`@asmjs/create`, `@asmjs/devtools`, `@asmjs/mcp`, `@asmjs/renderer-lit`,
`@asmjs/renderer-preact`, `@asmjs/renderer-react`, `@asmjs/renderer-solid`,
`@asmjs/renderer-svelte`, `@asmjs/renderer-templates`, `@asmjs/renderer-vue`.

## Before you start

Two-factor authentication is on for your npm account. Then:

    npm install -g npm@11
    npm login

## Publish each name once

1. **Check out the commit the seat names**, the one with the versions prepared and CI green:

       git clone https://github.com/ayers-software-repair/assemblejs.git ~/asmjs-publish
       cd ~/asmjs-publish
       git switch --detach <commit>

2. **Build it once:**

       pnpm install --frozen-lockfile && pnpm build

3. **Print the publish commands.** It fails on purpose, listing one command per unpublished
   name:

       node scripts/first-publish.mjs next

   Each command packs the package with pnpm and publishes the tarball with npm, for example:

       (cd packages/create && pnpm pack && npm publish ./asmjs-create-<version>.tgz --access public --tag next --provenance=false && rm asmjs-create-<version>.tgz)

4. **Publish `@asmjs/create` first.** Paste its line; npm asks for your code. Then:

       npm view @asmjs/create dist-tags

   Expect `next: '<version>'`. Tell the seat what `latest` shows: `npm create @asmjs` with no
   version reads `latest`.

5. **Publish the other thirteen**, one line each, each asking for your code.

6. **Confirm every name is on npm:**

       node scripts/first-publish.mjs next

   It ends with `every name is on the registry; trusted publishing publishes`.

7. **Cut the tag for this version.** The release run finds every version already on npm,
   publishes nothing, and deploys the site:

       git tag -a v<version> -m v<version>
       git push origin v<version>

   Then `rm -rf ~/asmjs-publish`.

## Hand over to trusted publishing

Do this on the day the seat says the next version is ready. A new trusted publisher expires
unless it publishes within two days.

8. **Add the trusted publishers.** The first command asks for your code; the rest run without it
   for five minutes:

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

9. **Close token publishing.** On each package's Settings, Publishing access, choose "Require
   two-factor authentication and disallow tokens". Trusted publishing is unaffected.

10. **Cut that next tag the same day.** Its release run publishes all fourteen through trusted
    publishing, with provenance.

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
- "The package you're configuring must already exist on the npm registry"; the `npm trust
github` flags; the first request asks for a second factor, then five minutes without:
  https://docs.npmjs.com/cli/v11/commands/npm-trust
- A new trusted publisher must publish within two days; disallowing tokens:
  https://docs.npmjs.com/trusted-publishers

Not stated by those pages: whether a first publish under `--tag next` also sets `latest`. Step 4
reads it.
