# The first publish of the @asmjs packages

None of the fourteen names is on npm yet. npm lets a trusted publisher be set only on a package
that already exists, so the first version of each name is staged by the release run and goes
live when you approve it with your second factor. The token the run uses can only stage: it
cannot publish, and nothing here bypasses two-factor authentication. After the first publish,
trusted publishing releases every version and no token is kept.

The fourteen names: `@asmjs/build`, `@asmjs/check`, `@asmjs/cli`, `@asmjs/core`,
`@asmjs/create`, `@asmjs/devtools`, `@asmjs/mcp`, `@asmjs/renderer-lit`,
`@asmjs/renderer-preact`, `@asmjs/renderer-react`, `@asmjs/renderer-solid`,
`@asmjs/renderer-svelte`, `@asmjs/renderer-templates`, `@asmjs/renderer-vue`.

## Before you start

- Two-factor authentication is on for your npm account. Approving a staged version needs it.
- npm 11.15.0 or later, for `npm stage`:

      npm install -g npm@^11.15.0
      npm login

## Steps

1. **Make the stage-only token** on npmjs.com: your avatar, Access Tokens, Generate New Token.
   - Token name: `asmjs first publish`.
   - "Bypass two-factor authentication": leave it unchecked.
   - Packages and scopes: permission "Read and write (stage only)", "Only select packages and
     scopes", then the `@asmjs` scope.
   - Organizations: "No access".
   - Expiration: 7 days.

   Generate it and copy it.

2. **Save it for the release run.** Paste the token when the command asks for it:

       gh secret set NPM_STAGE_TOKEN --env release --repo ayers-software-repair/assemblejs

3. **Cut the release tag** on the commit the seat names, with the version it prepared:

       git tag -a v1.0.0-next.N -m v1.0.0-next.N <commit>
       git push origin v1.0.0-next.N

   The release run stages all fourteen names, then stops red with
   `staged ...: nothing is published until each is approved`. Nothing is public yet except
   npm's placeholder version `0.0.0-stage` for each name.

   If the staging step fails with an authorization error, the scope selection did not cover
   names that do not exist yet. Make the token again with "All Packages" in place of the
   `@asmjs` scope, still stage only, save it with step 2, and re-run the run (step 6).

4. **Test one name first.**

       npm view @asmjs/create dist-tags
       npm stage list @asmjs/create
       npm stage approve <stage-id> --otp <code>
       npm view @asmjs/create dist-tags versions

   Expect `next: '1.0.0-next.N'`. If `latest` still points at `0.0.0-stage`, stop and tell the
   seat: `npm create @asmjs` reads `latest`, and would run the empty placeholder.

5. **Approve the other thirteen.** For each name:

       npm stage list <name>
       npm stage approve <stage-id> --otp <code>

   You can approve on npmjs.com as well; it asks for the same code.

6. **Re-run the release run.** Every name is now on the registry, so it stages nothing,
   `changeset publish` skips the versions that are already there, and the site deploys:

       gh run list --workflow release.yml --repo ayers-software-repair/assemblejs --limit 1
       gh run rerun <run-id> --repo ayers-software-repair/assemblejs

7. **Delete the token.** On npmjs.com, Access Tokens, delete `asmjs first publish`. Then:

       gh secret delete NPM_STAGE_TOKEN --env release --repo ayers-software-repair/assemblejs

8. **Add the trusted publishers when the next release is ready.** A new trusted publisher
   expires unless it completes a publish within two days, so do this the day the seat says the
   next tag is ready, then cut that tag. The first command asks for your code; the rest run
   without it for five minutes. For each of the fourteen names:

       npm trust github <name> --file release.yml --repo ayers-software-repair/assemblejs --env release --allow-publish

9. **Close token publishing.** On each package's Settings, Publishing access, choose "Require
   two-factor authentication and disallow tokens". Trusted publishing is unaffected.

## Sources

- Staging creates a new name and publishes the placeholder `0.0.0-stage`; approval needs a
  second factor on the command line or on npmjs.com; npm 11.15.0 or later:
  https://docs.npmjs.com/staged-publishing
- "Staged publishing will allow you to create a new package if it does not exist"; staging
  works with any token type, approving prompts for the second factor; `--tag`, `--access`,
  `--provenance`, `npm stage list` and `npm stage approve <stage-id>`:
  https://docs.npmjs.com/cli/v11/commands/npm-stage
- The "Read and write (stage only)" permission, the "Bypass two-factor authentication" checkbox
  (unchecked by default) and package or scope selection:
  https://docs.npmjs.com/creating-and-viewing-access-tokens
- "Bypass-2FA tokens with direct-publish access are being deprecated"; direct publishing with a
  granular token is removed in January 2027; a stage-only token cannot publish
  (`E_STAGE_REQUIRED`): https://docs.npmjs.com/about-access-tokens
- "The package you're configuring must already exist on the npm registry"; the `npm trust
  github` flags; the first request asks for a second factor, then five minutes without:
  https://docs.npmjs.com/cli/v11/commands/npm-trust
- A new trusted publisher must complete its first publish within two days; disallowing tokens:
  https://docs.npmjs.com/trusted-publishers
- `gh secret set --env`, `gh secret delete --env`, `gh run rerun`:
  https://cli.github.com/manual/gh_secret_set, https://cli.github.com/manual/gh_secret_delete,
  https://cli.github.com/manual/gh_run_rerun

Not stated by those pages: which dist-tag the `0.0.0-stage` placeholder carries (step 4 tests
it), and whether a token limited to the `@asmjs` scope covers names not yet published (step 3
names the fallback).
