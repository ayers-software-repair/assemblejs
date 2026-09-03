# JS toolchain: verification and adversarial review

Date: 2026-09-03. Every version claim below was read off `npm view`, the package's own
`node_modules/*/package.json`, or a URL fetched on this date. Every behavioural claim was
**watched failing on a known-bad input** in this working tree before it was written down; the
probe and its output are quoted inline.

---

## 0. Read this first

### 0.1 A probe of mine was committed. Commit `65a08ff` is red.

While these probes were running, `65a08ff` ("feat(core): the package shell, and every
organization rule as a gate") was created with my red-test line still in the working tree:

    $ git show 65a08ff:packages/core/src/client/mount-handle.ts | tail -2

    import "../compose/limits.js";

That line is a deliberate violation of this repo's own `client-stays-browser-only` rule and was
mine, not the author's. The **working tree is already correct** (I reverted by inverse edit; the
file now shows as ` M` against HEAD). The fix is to commit the deletion, or amend `65a08ff`.
Nothing else of mine reached any commit — `git ls-tree -r --name-only HEAD | grep -E 'zz-|probe'`
returns nothing.

### 0.2 Three gates in this repo are silently doing nothing

Each is proven below with a red-then-green probe:

| Gate                                                    | Status                                         | Section |
| ------------------------------------------------------- | ---------------------------------------------- | ------- |
| `import-x/no-cycle` (eslint.config.js:47)               | **silent on a real 2-file cycle**              | C.1     |
| `import-x/extensions` (eslint.config.js:57)             | **silent on an extensionless relative import** | C.2     |
| `no-bundler-at-runtime` (.dependency-cruiser.cjs:44-52) | **structurally unreachable**                   | C.3     |

### 0.3 CI does not run the gates `pnpm check` runs

`package.json:21` defines `check` as twelve steps. `.github/workflows/ci.yml:47-66` runs seven of
them and **omits five**: `check:organization`, `check:mirror`, `check:modules` (depcruise),
`check:exports`, `check:publish` (publint + attw). CLAUDE.md's "Organization" section names all of
them as enforced. On `main` today they are enforced only on a developer's laptop.

Right now, on the tree as it stands, one of the omitted gates is **already red**:

    $ node scripts/check-organization.mjs
    organization check failed, 1 problem(s):
      packages/core/src/compose/settle-placement.ts: [rule 1] exports 2 things (SettleInput, settlePlacement); one per file

CI is green on that commit. Fix: replace the seven ad-hoc steps with `run: pnpm check`, so the
gate list has exactly one definition.

### 0.4 knip, syncpack and sort-package-json are installed and invoked by nothing

`grep -n "knip\|syncpack\|sort-package-json" package.json .github/workflows/*` matches only the
`devDependencies` block. There is no `knip.json`, no `.syncpackrc`, no script, no CI step.
CLAUDE.md claims `knip` ("an export nothing reads is deleted") and `syncpack` ("one version of a
dependency across the workspace") are enforcing. They are not.

---

## A. Verdict table

Format: the ONE defect the tool uniquely catches in _this_ stack — a defect already caught by
`tsc --noEmit` (NodeNext + `strict` + `verbatimModuleSyntax`) or by another listed tool is not a
justification.

### KEEP

| Tool                                      | Installed      | Latest  | The one defect only it catches here                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------------------------- | -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `eslint`                                  | 10.9.1         | 10.9.1  | Lexical rules with no type equivalent: `no-console` in a published package; `no-useless-assignment`; `preserve-caught-error`. Latest confirmed at `npm view eslint version`; v10 release post: https://eslint.org/blog/2026/02/eslint-v10.0.0-released/                                                                                                                                                                                                                                          |
| `@eslint/js`                              | 10.0.1         | 10.0.1  | Supplies `js.configs.recommended`. Not separable from eslint.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `typescript-eslint`                       | 8.69.0         | 8.69.0  | TS-semantics rules with no tsc equivalent: `no-explicit-any`, `consistent-type-imports`, and (once `projectService` is on) `no-floating-promises`. **This package is what pins you to TS 6**: its manifest declares `"typescript": ">=4.8.4 <6.1.0"` — read locally from `node_modules/typescript-eslint/package.json` and confirmed at https://registry.npmjs.org/typescript-eslint/8.69.0. npm `latest` for `typescript` is now **7.0.2**; that is out of range. Constraint confirmed correct. |
| `prettier`                                | 3.9.6          | 3.9.6   | Formatting. ESLint's guidance is unchanged and still names Prettier first: _"We recommend using a source code formatter instead of ESLint for formatting your code."_ https://eslint.org/blog/2023/10/deprecating-formatting-rules/ . ESLint ships **no** code formatter — https://eslint.org/docs/latest/use/formatters/ is about report output (`stylish`, `json`, `html`), not source formatting.                                                                                             |
| `dependency-cruiser`                      | 18.2.0         | 18.2.0  | **Architectural layer rules.** Its rule vocabulary (`from`/`to` path policies, `reachable`, `ancestor`, `dependencyTypes`) is module-granular and nothing else here has it: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md . `client-stays-browser-only` and `no-node-builtins-in-client` were both watched firing (§C.3). Cycles and orphans are _not_ its unique contribution — knip does both.                                                               |
| `knip`                                    | 6.34.0         | 6.34.0  | **Unused exports (symbol-level) and unused/unlisted dependencies.** dependency-cruiser has no symbol-level attribute at all (link above). Watched producing a true finding on this tree: `Unused devDependencies (5): @arethetypeswrong/cli, publint, sort-package-json, syncpack, tsup`. Issue types: https://knip.dev/reference/issue-types                                                                                                                                                    |
| `publint`                                 | 0.3.24         | 0.3.24  | **Runtime** resolution of the published tarball — `exports`/`main`/`module` correctness, ESM/CJS extension-format mismatch, missing files. https://publint.dev/docs/ . Disjoint from attw, which checks _type_ resolution. Ran green: `Running publint v0.3.24 for @assemblejs/core... All good!`                                                                                                                                                                                                |
| `@arethetypeswrong/cli`                   | 0.18.5         | 0.18.5  | **Type** resolution under each module-resolution mode. `--profile esm-only` is still a valid value in 0.18.x (`strict` / `node16` / `esm-only`): https://raw.githubusercontent.com/arethetypeswrong/arethetypeswrong.github.io/main/packages/cli/README.md . Ran green on all four subpaths.                                                                                                                                                                                                     |
| `syncpack`                                | 15.3.3         | 15.3.3  | **One version of a dependency across packages** — inert today at one package, load-bearing at the eleven CLAUDE.md names. Commands changed in v14: `list-mismatches` → `lint`, `fix-mismatches` → `fix`: https://syncpack.dev/guide/migrate-v14/ . It also subsumes `sort-package-json` — see CUT.                                                                                                                                                                                               |
| `@commitlint/cli` + `config-conventional` | 21.2.2         | 21.2.2  | Conventional-commit shape. CONTRIBUTING requires it; nothing else reads a commit message except `check-trailers.sh`, which checks trailers only.                                                                                                                                                                                                                                                                                                                                                 |
| `husky` + `lint-staged`                   | 9.1.7 / 17.4.1 | same    | Pre-commit execution. No native Node equivalent.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `@changesets/cli`                         | 3.0.1          | 3.0.1   | Non-negotiable. Current — https://registry.npmjs.org/@changesets/cli (3.0.1, 2026-08-19). `changesets/action` v2.1.1 is also current.                                                                                                                                                                                                                                                                                                                                                            |
| `vitest`                                  | 4.1.11         | 4.1.11  | Non-negotiable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `typescript`                              | 6.0.3          | 7.0.2   | Non-negotiable and correctly pinned back — see typescript-eslint above.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `globals`                                 | 17.12.0        | 17.12.0 | Supplies `globals.node` / `globals.browser`. Used.                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### KEEP (CONSTRAINED — flagged cost)

| Tool         | Verdict                                                                               | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tsup` 8.5.1 | **Officially unmaintained.** Constraint says keep it, so: KEEP, with the cost stated. | The README's first line, fetched today: _"This project is not actively maintained anymore. Please consider using tsdown instead. Read more in the migration guide."_ https://raw.githubusercontent.com/egoist/tsup/main/README.md . Latest release 8.5.1 was 2025-11-12 (https://api.github.com/repos/egoist/tsup/releases/latest); the only commit since is `b6bcae8` 2026-05-05, _"ci: update workflow references to main branch"_ (https://api.github.com/repos/egoist/tsup/commits). Repo is **not** archived. |

**What the constraint is costing you, specifically.** Five open, unmerged issues/PRs about
TypeScript 6/7 (`https://api.github.com/repos/egoist/tsup/issues/1388` and neighbours):

- #1388 _"DTS Build error TS5101: Option 'baseUrl' is deprecated"_ — open since 2026-03-24. Reporter's stack is yours exactly: `tsup ^8.5.1` + `typescript ^6.0.2` + `dts: true`.
- #1389 "Support TypeScript 6", #1390 (PR) "Fix compatibility with TypeScript 6 or 7" — both open.
- #1405 "resolve TypeScript 7 build breakage caused by tsup/rollup-plugin-dts incompatibility", #1409 (PR) "fix: support TypeScript 7 declaration builds" — both open.

`packages/core/tsup.config.ts:13` (`dts: { compilerOptions: { ignoreDeprecations: "6.0" } }`) is
the documented workaround for #1388, and the file's comment correctly names why. The forward
problem is #1405: when you move to TS 7, tsup's bundled `rollup-plugin-dts` breaks, and the fix is
an unmerged PR in an unmaintained repo. **Do not budget on tsup surviving the TS 7 move.** The
replacement the README names, `tsdown`, is still 0.x (`latest: 0.22.14`,
https://registry.npmjs.org/-/package/tsdown/dist-tags), though its engine Rolldown is 1.x GA
(v1.2.7, 2026-09-02, `prerelease: false`, https://api.github.com/repos/rolldown/rolldown/releases/latest).
No action now; put it in `docs/DECISIONS.md` as a known dependency risk with #1405 as the trigger.

Background on the deprecation itself: _"In TypeScript 6.0, `baseUrl` is deprecated and will no
longer be considered a look-up root for module resolution"_ —
https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/

### CUT

| Tool                                          | Why it does not earn its place                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`eslint-plugin-import-x` 4.17.1**           | CUT — every rule it contributes is either already caught by `tsc` / dependency-cruiser, or is silently broken. Rule by rule, all watched: `no-cycle` — **silent** as wired (§C.1), and dependency-cruiser's `no-circular` catches the same cycle, watched firing. `no-self-import` — fires, but depcruise `no-circular` catches a self-import too, watched firing on `zz-self.ts → zz-self.ts`. `extensions` — **silent** (§C.2); `tsc` emits `TS2835` for the same input, watched. `no-useless-path-segments` — the config comment at :49-51 already records that its autofix breaks NodeNext, so it is now half-off. `order` and the rest are style, not defect. **If you keep it anyway** the wiring is wrong and must be fixed (§C.1). It is still a live, maintained fork — it has **not** merged back into `eslint-plugin-import`; the README states the fork exists because _"eslint-plugin-import refused to accept BREAKING CHANGES"_ (https://github.com/un-ts/eslint-plugin-import-x), and its peer range already accepts eslint 10 (`"eslint": "^8.57.0 \|\| ^9.0.0 \|\| ^10.0.0"`, read from `node_modules/eslint-plugin-import-x/package.json`). Cutting it is an economy call, not a maintenance one. |
| **`eslint-import-resolver-typescript` 4.4.5** | CUT — it exists only to serve import-x. Dead the moment import-x goes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **`eslint-plugin-unicorn` 74.0.0**            | CUT — you enable exactly one rule from it (`filename-case`, eslint.config.js:42) and `scripts/check-organization.mjs:126` already enforces the same thing, more strictly. Watched, same input, both fire: eslint says _"Filename is not in kebab case. Rename it to `wrong-case.ts`"_; check-organization says _"[rule 1] filename \"WrongCase\" is not kebab-case"_ **and** _"exports wrongCaseThing, so the file is \"wrong-case-thing.ts\""_. The AST gate is a strict superset. A ~100-rule plugin for one duplicated rule is not worth a dependency.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **`sort-package-json` 4.0.0**                 | CUT — proven duplicate of `syncpack format --check`. Same two files, same defect, same run: `sort-package-json --check` → _"2 files were not sorted"_; `syncpack format --check` → _"PackagePropertiesAreNotSorted at root"_ on `package.json` and `packages/core/package.json`. Keeping both risks two tools disagreeing on an ordering. Note that either one **moves your custom `ayersPlatform` key** (sort-package-json relocates it to the end of root `package.json`) — decide the ordering once, in `.syncpackrc`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### REPLACE

Nothing. Considered and rejected — see B.7.

---

## B. What to add

Five additions. Each is justified by a defect nothing currently here catches. Everything else on
your list is rejected in B.7 with the reason.

### B.1 Type-aware linting — the single highest-value change, and it is not a new dependency

Nothing in this toolchain catches an unawaited promise. Watched: a file containing
`export async function f(){}` and `export function g(){ f(); }` lints clean today, and
`eslint --print-config` on a `src` file returns `"parserOptions": {}` — no project service, so no
type information reaches any rule.

typescript-eslint 8.69.0 is already installed. Edit `eslint.config.js`:

```js
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: { /* unchanged */ },
  },
  // Config and script files are outside every tsconfig; type-aware rules cannot run on them.
  {
    files: ["**/*.{js,cjs,mjs}", "*.config.ts"],
    extends: [tseslint.configs.disableTypeChecked],
  },
```

No install command. Unlocks `no-floating-promises`, `no-misused-promises`, `await-thenable`,
`no-unnecessary-condition`. Expect a first run to be slower and to surface real findings.

### B.2 Vitest coverage

`.gitignore:10` and `eslint.config.js:10` both already ignore `coverage/`, so the decision was
half-made. Either wire it or delete those two lines.

    pnpm add -Dw @vitest/coverage-v8@4.1.11

**Vitest 4 changed this and the change is a trap**: _"In Vitest v4 we have removed `coverage.all`
completely and defaulted to include only covered files in the report"_ and _"When upgrading to v4
it is recommended to define `coverage.include` in your configuration"_ —
https://vitest.dev/guide/migration . Without an explicit `include`, an untested file contributes
nothing and your thresholds report a number that is not the truth. `v8` is still the recommended
provider; there is no new one (https://vitest.dev/guide/coverage).

`packages/core/vitest.config.ts`, added inside `defineConfig`:

```ts
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/index.ts"],
      reporter: ["text", "lcov"],
      reportOnFailure: true,
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
```

`packages/core/package.json` scripts:

```json
    "test:coverage": "vitest run --coverage",
```

Root `package.json`: add `pnpm -r test:coverage` to `check` if you want the threshold to gate.

### B.3 `@vitest/eslint-plugin` — for exactly one rule

    pnpm add -Dw @vitest/eslint-plugin@1.6.27

**Justification is per-rule, not per-plugin.** `no-focused-tests` catches a committed `.only`,
which silently green-lights CI on a fraction of the suite. Nothing else here catches it — not
tsc, not vitest itself, not `check-mirror.mjs`. `expect-expect` and `no-identical-title` are the
same class (a test that cannot fail). The rest of the plugin is style; do not enable
`configs.recommended` wholesale. Peer range is `"eslint": ">=8.57.0"`, so eslint 10.9.1 is in
range (https://github.com/vitest-dev/eslint-plugin-vitest).

`eslint.config.js`, appended:

```js
  {
    files: ["packages/*/test/**/*.test.ts"],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/expect-expect": "error",
      "vitest/no-identical-title": "error",
    },
  },
```

with `import vitest from "@vitest/eslint-plugin";` at the top.

### B.4 A `knip.json`, or knip stays noise

Without a config, knip reports 25 false positives on this tree (16 test files plus every fixture)
and gives you the reason itself:

    Configuration hints (2)
    packages/core    .  Create knip.json configuration file with workspaces["packages/core"] object (16 unused files)

Root cause: knip's vitest plugin only activates _"if there's a match in `dependencies` or
`devDependencies`"_ **per workspace** (https://knip.dev/reference/plugins/vitest) and
_"In a project with workspaces, the `entry` and `project` options at the root level are ignored"_
(https://knip.dev/features/monorepos-and-workspaces). `knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "workspaces": {
    ".": {
      "entry": ["scripts/*.mjs", "eslint.config.js"],
      "project": ["scripts/**/*.mjs", "!scripts/fixtures/**"]
    },
    "packages/*": {
      "entry": ["src/index.ts!", "src/renderer/index.ts!", "src/client/index.ts!"],
      "project": ["src/**/*.ts!", "test/**/*.ts"]
    }
  }
}
```

`test/**/*.ts` deliberately carries no `!` — in default mode the vitest plugin claims those files
as entries; in production mode they drop out of `project` and cannot be reported.

`package.json` scripts:

```json
    "check:unused": "knip && knip --production",
```

Two runs, because _"The production run does not replace the default run"_
(https://knip.dev/features/production-mode). Add `check:unused` to `check`.

**Do not also enable knip's cycle detection.** It has one (`--cycles`, watched firing:
`Circular dependencies (1) packages/core/src/compose/zz-cyc1.ts → zz-cyc2.ts → zz-cyc1.ts`) but
depcruise's `no-circular` was watched firing on the identical input. One cycle detector.

### B.5 A `.syncpackrc`, plus the two commands, and cut `sort-package-json`

`syncpack lint` currently emits a false positive on the private root package:

    ! VERSION_IS_MISSING in package.json at .version (InvalidLocalVersion) (local)
    ✓ No issues found

`.syncpackrc.json`:

```json
{
  "$schema": "./node_modules/syncpack/schema.json",
  "sortFirst": [
    "name",
    "version",
    "description",
    "license",
    "author",
    "homepage",
    "repository",
    "bugs",
    "type",
    "sideEffects",
    "engines",
    "files",
    "publishConfig",
    "exports",
    "scripts"
  ],
  "versionGroups": [
    { "packages": ["assemblejs-monorepo"], "dependencies": ["**"], "isIgnored": true }
  ]
}
```

`package.json` scripts (and delete `sort-package-json` from `devDependencies`):

```json
    "check:packages": "syncpack lint && syncpack format --check",
```

Config file names and the `lint` / `format --check` split are documented at
https://syncpack.dev/config/syncpackrc/ and https://syncpack.dev/command/format/ .

### B.6 CI must run the gates, and `release.yml` has two real problems

**(a) Replace ci.yml:47-66 with `pnpm check`.** See §0.3.

**(b) `release.yml:47-48` is dead code.**

```yaml
- name: npm 11.5.1 or newer, required for trusted publishing
  run: npm install -g npm@^11.5.1 && npm --version
```

pnpm 11 no longer shells out to npm. From the pnpm 11.0.0 release notes: _"`pnpm publish`, `login`,
`logout`, `view`, `deprecate`, `unpublish`, `dist-tag`, and `version` no longer delegate to the npm
CLI"_ and _"pnpm no longer falls back to the npm CLI"_ (https://pnpm.io/blog/releases/11.0). pnpm
performs the OIDC exchange itself — v11.0.7: _"Make trusted publishing (OIDC) take precedence over
a configured static `_authToken` in `pnpm publish`, mirroring the npm CLI's behavior."_ Your
`packageManager: pnpm@11.4.0` is past the 11.1.3 fix for the `_authToken=${NODE_AUTH_TOKEN}`
placeholder E404 regression that affected 11.0.8-11.1.2. Delete the step; it upgrades a binary
nothing calls. (The npm requirement itself is real for the _npm_ client: _"Trusted publishing
requires npm CLI version 11.5.1 or later and Node version 22.14.0 or higher"_ —
https://docs.npmjs.com/trusted-publishers.)

**(c) `release.yml:26-28` grants `id-token: write` to a job that also builds and opens the version
PR.** changesets' own guidance: _"make sure the `id-token: write` is only set on the job that needs
to publish. As such, consider splitting the build, test, publish flows etc into separate jobs."_
(https://changesets.dev/guide/automating). The same page: _"At the moment, Staged Publishing does
not work with Changesets, so you should use Trusted Publishing instead for now."_ The
`changesets/action` README adds: _"If using trusted publishing, it's recommended to set up the
individual sub-actions instead to tighten publish permissions"_
(`changesets/action/select-mode`, `/version`, `/publish`).

The publish path itself is sound and was verified in the shipped artifact: `@changesets/cli@3.0.1`
contains `exec("pnpm", ["publish", ...args])` and its `sanitizeEnv` nulls only the four OTP
variables, so `ACTIONS_ID_TOKEN_REQUEST_*` reaches the child untouched
(https://raw.githubusercontent.com/changesets/changesets/main/packages/cli/src/commands/publish/getPublishTool.ts).

### B.7 Rejected, with the reason

| Candidate                                   | Verdict           | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **oxlint** as an eslint replacement         | REJECT            | Its type-aware mode _"requires TypeScript **7.0+**"_ via `tsgo` (https://oxc.rs/docs/guide/usage/linter/type-aware.html). Your non-negotiable is TS 6, and typescript-eslint 8.69.0's `<6.1.0` pin forbids TS 7 anyway. It cannot deliver `no-floating-promises` on this stack at any speed.                                                                                                                                                                                                       |
| **Biome** as an eslint+prettier replacement | REJECT            | _"our noFloatingPromises rule ... can detect floating promises in about 75% of the cases that would be detected by using typescript-eslint"_ (https://biomejs.dev/blog/biome-v2/), and the rule is still **nursery**, default severity Information (https://biomejs.dev/linter/rules/no-floating-promises/). Formatter parity is 97% (https://biomejs.dev/). A 25% miss rate on the one rule you are adding it for is not a trade.                                                                 |
| **`eslint-config-prettier`**                | REJECT            | Only needed if formatting rules are enabled. `js.configs.recommended` + `tseslint.configs.recommended` enable none, and v10 removed no formatting rule. Adding it turns nothing off.                                                                                                                                                                                                                                                                                                               |
| **`.nvmrc`**                                | REJECT            | Triply covered: `engines.node: ">=22"`, `.npmrc engine-strict=true`, and the `node: [22, 24]` CI matrix. A fourth copy is a fourth thing to forget to bump.                                                                                                                                                                                                                                                                                                                                        |
| **EditorConfig**                            | REJECT            | `.editorconfig` already exists and is correct.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **`lockfile-lint`**                         | REJECT            | It does not support pnpm, **by design**. README FAQ: _"pnpm doesn't maintain the tarball source of an npm package so unlike yarn, and npm, there's no way to inject an attacker-controlled malicious source file in `pnpm-lock.yaml`"_ (https://raw.githubusercontent.com/lirantal/lockfile-lint/main/README.md). `--type` accepts `yarn` and `npm` only.                                                                                                                                          |
| **`npm-package-json-lint`**                 | REJECT            | Maintained (v11.0.0, 2026-08-15) but it lints package.json _style_; publint validates _publish correctness_. With publint + attw + syncpack already in place it adds house-style rules only.                                                                                                                                                                                                                                                                                                       |
| **`madge`**                                 | REJECT            | Its one defect class is cycles, already covered twice (depcruise `no-circular`, watched firing; knip `--cycles`, watched firing). Last publish 2024-08-05.                                                                                                                                                                                                                                                                                                                                         |
| **`ts-prune`**                              | REJECT            | _"This repository was archived by the owner on Sep 19, 2025"_ and its own README says _"we recommend knip which carries forward the same mission"_ (https://github.com/nadeesha/ts-prune). Last release 0.10.3, 2021.                                                                                                                                                                                                                                                                              |
| **`osv-scanner`**                           | REJECT, for now   | It does support `pnpm-lock.yaml` (https://google.github.io/osv-scanner/supported-languages-and-lockfiles/) and it gates a PR where Dependabot only opens one. But `@assemblejs/core` has **zero** runtime `dependencies`; the entire surface is devDependencies, which `.github/dependabot.yml` already watches weekly in two groups. Revisit when the first runtime dependency lands.                                                                                                             |
| **OpenSSF Scorecard**                       | ALREADY PRESENT   | `.github/workflows/scorecard.yml` exists, SHA-pinned, uploading SARIF. Nothing to add.                                                                                                                                                                                                                                                                                                                                                                                                             |
| **`zizmor`** (workflow static analysis)     | REJECT, narrowly  | It catches `template-injection` per-PR, which Scorecard's weekly `Dangerous-Workflow` check does not. But your workflows already do the safe thing by hand — every `uses:` is SHA-pinned, `permissions` are least-privilege, and `ci.yml:82-85` routes `github.event.pull_request.*.sha` through `env:` rather than interpolating into `run:`. One more tool for a defect class you have already designed out. Reconsider if a workflow ever interpolates an untrusted `${{ }}` into a shell line. |
| **pnpm `minimumReleaseAge`**                | NO ACTION, VERIFY | Delays installing brand-new (possibly hijacked) versions; _"default 1440 minutes since v11"_ per https://pnpm.io/settings/dependency-resolution. `pnpm config get minimumReleaseAge` returns `undefined` here, i.e. unset, i.e. the v11 default applies. Setting it explicitly in `pnpm-workspace.yaml` would document the intent, but changes no behaviour.                                                                                                                                       |

---

## C. Defects in the existing configs

### C.1 `eslint.config.js:47` — `import-x/no-cycle` never fires. `import-x/parsers` is missing.

**Watched.** Two files forming a genuine cycle, in `packages/core/src/compose/`:

    zz-cyc1.ts:  import { y } from "./zz-cyc2.js";  export const z = y;
    zz-cyc2.ts:  import { z } from "./zz-cyc1.js";  export const y = z;

    $ pnpm exec eslint packages/core/src/compose/zz-cyc1.ts packages/core/src/compose/zz-cyc2.ts
    (no output)

    $ pnpm exec depcruise --config .dependency-cruiser.cjs packages
      error no-circular: packages/core/src/compose/zz-cyc1.ts →
          packages/core/src/compose/zz-cyc2.ts →
          packages/core/src/compose/zz-cyc1.ts

The rule _is_ enabled — `eslint --print-config` returns
`"import-x/no-cycle": [2,{"maxDepth":null,...}]`. It is not an options problem: `"error"`,
`{maxDepth: Infinity}`, `{maxDepth: 10}` and `{ignoreExternal: true}` were all watched, all
silent. It is not a resolver problem either: with the same `settings`, `import-x/no-unresolved`
correctly reports _"Unable to resolve path to module './does-not-exist.js'"_, and
`import-x/no-self-import` correctly reports _"Module imports itself"_.

**Root cause**: `no-cycle`, `named`, `namespace`, `default` and `export` all need import-x to
_parse the imported file_ to build its ExportMap. Doing that for a `.ts` file requires
`settings["import-x/parsers"]`, which eslint.config.js:37-39 does not set.
`importX.flatConfigs.typescript` sets it — dumped from the installed package:

    "import-x/parsers": { "@typescript-eslint/parser": [".ts", ".tsx", ".cts", ".mts"] }

**Minimal fix, watched going green→red:** adding only that one settings key to the existing
config makes both files report _"Dependency cycle detected import-x/no-cycle"_.

If you keep import-x (§A says cut it), the wiring the plugin's own README prescribes is
`importX.flatConfigs.recommended` + `importX.flatConfigs.typescript`, and the flat-config resolver
key is `import-x/resolver-next`, not `import-x/resolver` — _"Only available in the new flat config
system. If you are using the legacy config system, please use `import-x/resolver` instead."_
(https://github.com/un-ts/eslint-plugin-import-x). Both resolver forms were watched working
identically for `no-unresolved`, so the resolver key is a style choice; `import-x/parsers` is not.

Related: `@typescript-eslint/parser` is **not resolvable from the repo root** under pnpm's isolated
`node_modules` (`require.resolve` → `MODULE_NOT_FOUND`). It resolves today only because import-x
loads it from its own location. If you keep import-x, add `@typescript-eslint/parser` as an
explicit devDependency rather than relying on that.

### C.2 `eslint.config.js:57` — `import-x/extensions` enforces nothing, and `tsc` already does the job

**Watched, both directions.** In `packages/core/src/compose/`:

| Written specifier    | eslint | tsc                                                                                                                                                                        |
| -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from "./limits"`    | clean  | `error TS2835: Relative import paths need explicit file extensions in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './limits.js'?` |
| `from "./limits.js"` | clean  | clean                                                                                                                                                                      |

`{ js: "always", ts: "never" }` reads the _written_ extension first (`.js` → `js: "always"` → OK)
and falls through to the _resolved_ file's extension when there is none (`limits.ts` → `ts:
"never"` → also OK). Both forms pass. The comment at :53-56 — _"The rule requires what Node
requires"_ — is the opposite of what the rule does. The gate that actually holds this line is
`tsc --noEmit` under `module: NodeNext`, and it is already in `pnpm typecheck`. Delete the rule.

### C.3 `.dependency-cruiser.cjs:77` — `options.exclude` makes `no-bundler-at-runtime` unreachable

`exclude: { path: "(^|/)(dist|coverage|node_modules)/" }` removes every `node_modules` module from
the graph. `no-bundler-at-runtime` (:44-52) matches on `to: { path: "node_modules/(vite|...)" }`.
A rule that targets exactly what `exclude` deletes can never match.

**Watched, red-then-green.** Same source line (`import "vitest";` in `packages/core/src/compose/`),
same rule with `vitest` added to its regex, two configs differing only in `exclude`:

    exclude: "(^|/)(dist|coverage|node_modules)/"     ->  no dependency violations found (41 modules, 30 dependencies)
    exclude: "^(packages/[^/]+/dist|coverage)/"       ->  error no-bundler-at-runtime:
                                                            packages/core/src/compose/limits.ts →
                                                            node_modules/.pnpm/vitest@4.1.11_.../node_modules/vitest/dist/index.d.ts
                                                          (44 modules, 49 dependencies)

Two separate faults in that one regex:

1. `node_modules` in the alternation kills every `node_modules`-targeting rule.
2. `(^|/)dist/` matches **any** path segment named `dist`, including inside the pnpm store —
   which is why an intermediate probe that removed only `node_modules` from the alternation still
   did not fire: vitest resolves through `.../vitest/dist/index.js`.

The other two custom rules are fine and were **watched firing** on the current config:

    error no-node-builtins-in-client: packages/core/src/client/mount-handle.ts → fs
    error client-stays-browser-only:  packages/core/src/client/mount-handle.ts → packages/core/src/compose/limits.ts

`no-orphans` (:16-35) and `not-to-unresolvable` (:36-42) were also watched firing.

**Fix**, replacing :77:

```js
    exclude: { path: "^packages/[^/]+/(dist|coverage)/" },
    doNotFollow: { path: "node_modules" },
```

`doNotFollow` already keeps the crawl out of dependencies while leaving them _visible_ as graph
nodes — which is the whole point of the rule. Then scope `no-orphans` so third-party modules
cannot be reported as orphans, by adding `path: "^packages/"` to its `from`:

```js
      from: { orphan: true, path: "^packages/", pathNot: [ /* unchanged */ ] },
```

Also note: `package.json:26` runs `depcruise --config .dependency-cruiser.cjs packages` — **only
`packages`**. `scripts/` is never cruised, so `not-to-unresolvable` and `no-orphans` do not apply
to the gate scripts. Either add `scripts` to the argument list or say in the comment that the
graph rules are package-only.

### C.4 `packages/core/tsconfig.json:6-7` — the client/server boundary is not in the type system

`"types": ["node"]` and `"lib": ["ES2022", "DOM"]` are global to the whole package, so **both**
directions of the boundary typecheck clean. Watched, both:

    packages/core/src/compose/zz-probe.ts:
      export const el = document.querySelector("div");
      export const w = window.location.href;
    -> tsc --noEmit: clean.  eslint: clean.

    packages/core/src/client/zz-probe.ts:
      import { readFileSync } from "node:fs";
    -> tsc --noEmit: clean.

dependency-cruiser catches the _import_ (§C.3, watched) but cannot see a bare global reference:
`document` in server code is invisible to every gate you have. Split the program:

`packages/core/tsconfig.json` (server + shared):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "types": ["node"], "lib": ["ES2022"] },
  "include": ["src", "test"],
  "exclude": ["src/client"]
}
```

`packages/core/tsconfig.client.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "noEmit": true, "types": [], "lib": ["ES2022", "DOM"] },
  "include": ["src/client"]
}
```

and `"typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.client.json"`.

### C.5 `packages/core/tsconfig.json:4` — `rootDir: "."` with `include: ["src", "test"]`

`declaration: true` (tsconfig.base.json:14) plus `outDir: "dist"` plus `rootDir: "."` means a
`tsc --build` would emit `dist/src/index.d.ts` and `dist/test/...`, neither of which matches the
`exports` map (`./dist/index.d.ts`). It is latent because tsup does the emitting and typecheck
passes `--noEmit`. It stops being latent the first time anyone runs `tsc -b` or switches the dts
step off tsup (see the tsup risk in §A). Either `"rootDir": "src"` with tests in their own
tsconfig, or drop `rootDir` and let tsup own the output shape.

### C.6 `eslint.config.js:13-30` — the base block has no `files`, so it applies to `.cjs` too

`--print-config commitlint.config.cjs` returns `sourceType: "module"`. That block is meant for the
TypeScript sources but matches `commitlint.config.cjs` and `.dependency-cruiser.cjs` as well.
Nothing breaks today (both files parse as ESM and `globals.node` supplies `module`), but it
overrides ESLint's per-extension default and is a trap for the first `.cjs` file that uses
`require()` at the top level. Scope it, or drop `sourceType` and let ESLint infer.

### C.7 `eslint.config.js:15` — `ecmaVersion: 2023` under-declares

The documented default is `"latest"`, and the docs recommend it so you always target the most
recent ECMAScript version (https://eslint.org/docs/latest/use/configure/language-options). On Node
22 with `target: "ES2022"` there is no reason to cap the _parser_ at 2023. Use `"latest"`.

### C.8 `eslint.config.js:10` — `"coverage/**"` is root-relative and will not match

Compare `"**/dist/**"` on the same line, which is correct. Coverage output lands in
`packages/core/coverage/`, which `"coverage/**"` does not match. Make it `"**/coverage/**"` — or,
if you take B.2's rejection, delete the entry along with `.gitignore:10`.

### C.9 `packages/core/vitest.config.ts:12-18` — the alias makes `check-exports.mjs` load-bearing, and it is not in CI

The comment at :8-10 is right about the trade and names the compensating gate. That gate,
`scripts/check-exports.mjs`, is not in `ci.yml` (§0.3). Until it is, an ESM-only package with three
subpath exports has **zero** CI proof that any of them import. This is the highest-consequence item
in §0.3; fix it with `run: pnpm check`.

### C.10 `packages/core/package.json:47` — `attw --pack .` shells out to `npm pack`, not `pnpm pack`

attw's own help text: _"Run `npm pack` in the specified directory"_, read from
`node_modules/@arethetypeswrong/cli/dist/index.js:37`. The README is explicit that _"the --pack
option does not support package managers other than npm at this time"_
(https://raw.githubusercontent.com/arethetypeswrong/arethetypeswrong.github.io/main/packages/cli/README.md).
Contrast publint, whose `--pack` accepts `'pnpm'` (https://publint.dev/docs/cli). It runs green
today because `files` is an explicit allowlist and there are no `workspace:` dependencies. The
first `workspace:*` dependency between packages will break it, because `npm pack` does not
understand that protocol. Pre-emptive fix: `pnpm pack --pack-destination . && attw ./*.tgz
--profile esm-only && rm ./*.tgz`.

### C.11 Minor

- `.changeset/config.json:2` pins `$schema` to `@changesets/config@3.0.0` while the CLI is 3.0.1. Cosmetic; bump for accuracy.
- `.lintstagedrc.json` runs `eslint --fix` but the `check` script does not run `prettier --check`. A file changed outside a commit hook (a merge, a bot) can reach CI unformatted and nothing objects. Add `"check:format": "prettier --check ."`.
- `eslint.config.js:12` uses `...tseslint.configs.recommended`. If you adopt B.1, that becomes `recommendedTypeChecked`, which is a superset; do not list both.

---

## D. What could not be verified

1. **Does pnpm's native publish generate provenance under OIDC?** `packages/core/package.json:27` sets `publishConfig.provenance: true`. npm's docs say provenance is automatic under trusted publishing for the _npm_ client — _"npm automatically generates and publishes provenance attestations ... you don't need to add the `--provenance` flag"_ (https://docs.npmjs.com/trusted-publishers) — but pnpm 11 no longer uses the npm client (§B.6b). Neither https://pnpm.io/cli/publish nor https://pnpm.io/settings mentions provenance under OIDC at all, and changesets passes no provenance flag (grep for `provenance` across the shipped `@changesets/cli@3.0.1` `dist/` returns zero). The setting is harmless either way. **Confirm on the first publish by checking for the provenance badge on the npm package page.** This is the one item that can only be settled by publishing.
2. **`pnpm publish` + OIDC is documented only in release notes.** https://pnpm.io/cli/publish documents `--otp` and `--provenance` and says nothing about trusted publishing, OIDC, or `NPM_ID_TOKEN`. The support is real (11.0.7 and 11.1.3 release notes) but there is no CLI reference page to point at.
3. **Whether knip's root-level `ignore` applies when `workspaces` is set.** The docs state only that root `entry`/`project` are ignored (https://knip.dev/features/monorepos-and-workspaces); `ignore`'s scope is unstated. B.4 routes `scripts/fixtures/**` through a negated `project` pattern instead, which is documented behaviour. Confirm with `knip --debug` on first run.
4. **Whether knip resolves the `attw` binary to `@arethetypeswrong/cli`.** knip has no plugin for `@arethetypeswrong/cli`, `publint`, or `sort-package-json`; it resolves them as binaries from `bin` fields, and its own guide documents `commitlint` as a case where that fails (https://knip.dev/guides/handling-issues). If `attw` reports as an unlisted binary, the fix is `ignoreBinaries`, **not** `ignoreDependencies`. Not testable until `check:publish` and a knip config coexist.
5. **oxlint's per-rule type-aware coverage.** The page claims _"59 out of 61 type-aware rules from typescript-eslint"_ but only `typescript/no-floating-promises` was confirmed by name; `no-misused-promises`, `await-thenable` and `no-unnecessary-condition` were not individually enumerated. Moot given the TS 7 requirement, but the claim is not fully checked.
6. **Whether ESLint 10 changed the per-extension `sourceType` default for `.cjs`/`.mjs`.** Neither the v10 migration guide nor https://eslint.org/docs/latest/use/configure/language-options states a per-extension default; the page shows a flat `"module"`. §C.6's recommendation rests on ESLint's documented general behaviour, not on a quoted per-extension rule.
7. **Whether syncpack treats the same dependency in `dependencies` and `devDependencies` of ONE package.json as two instances that must agree.** Not stated at https://syncpack.dev/version-groups/ . This is the pivot for whether syncpack catches anything beyond formatting at one package. Test empirically before relying on it.
8. **`https://www.npmjs.com/package/tsup` returns HTTP 403.** tsup's version and dates come from `https://registry.npmjs.org/tsup` and the GitHub releases API, not from the npm web page.
9. **No head-to-head osv-scanner vs Dependabot comparison exists in either vendor's docs.** The B.7 rejection rests on this repo having zero runtime dependencies, which is verifiable, rather than on a sourced coverage comparison, which is not.
10. **Timing of the tsup risk.** Issue #1405 is a TypeScript **7** break, not a TS 6 break; nothing says tsup 8.5.1 fails against TS 6.0.3, and the build runs green here today. The risk is entirely forward-looking.
