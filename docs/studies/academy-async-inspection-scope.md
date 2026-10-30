# Async inspection: bounded source investigation

Status: read-only scope investigation, independently verified. No helper signature, compiler,
runtime, hosting or release change is selected or implemented by this record. PR28 preserves
the rejected second-parser experiment; this investigates reuse of the existing compiler.

## Compiler reuse is plausible; a synchronous drop-in is not

The [official esbuild API](https://esbuild.github.io/api/#async-api) documents Promise-returning
`transform`, alongside `transformSync`. The installed 0.28.2 API was checked with identical
loader/ESM/automatic-JSX options in a parser-only local probe. Six valid inputs produced
identical code; three invalid inputs produced identical diagnostic text and source lines:

| accepted                                                | rejected                         |
| ------------------------------------------------------- | -------------------------------- |
| Local interface export from the PR28 counterexample     | Duplicate value export from PR28 |
| Local type-alias export from PR28                       | Mismatched TSX closing tag       |
| Exported variable plus named alias                      | Incomplete default-export object |
| Typed config using `as const` and `satisfies`           |                                  |
| JSX with a Preact import-source pragma and spread props |                                  |
| Lit class template containing a renderer slot           |                                  |

A separate reader repeated the nine comparisons and checked diagnostic columns too. These are
specific local observations, not whole-language parity or proof that the browser runtime's
async implementation works. Those comparisons started no AssembleJS server, browser or framework build.

The four leaves are `readDefaultExport`, `readNamedExport`, `scriptElements` in check, and
`scriptPlacements` in build. Merely replacing their calls with `transform` returns Promises
through functions currently declared to return direct values. `checkProject` already being
async does not repair its synchronous helpers or external callers.

## Source boundary and published contracts

A syntax-only named-reference inventory was checked against actual function bodies, directory
indexes, MCP callbacks and their installed protocol types. Its conservative first pass included
registration functions whose signatures need not change. Excluding those leaves 28 currently
synchronous exported helpers on a direct Promise-return migration path:

| package    | synchronous exported helpers                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| build (3)  | `scriptPlacements`, `readViewPlacements`, `viewFindings`                                                                                                                                                                                                                                                                                                                      |
| check (21) | `readDefaultExport`, `readNamedExport`, `scriptElements`, `readPagePolicy`, `pageRoute`, `readApi`, `notFoundRouteProblems`, `declaredOrigins`, `readBudgets`, `readAddresses`, `readViewExport`, `readViewMount`, `hasBrowserHalf`, `viewProblems`, `readViewElements`, `viewElements`, `elementProblems`, `readPageShape`, `readApiShape`, `readSettingsShape`, `readShape` |
| MCP (4)    | `describeProject`, `describeAssembly`, `projectAssemblies`, `placeInView`                                                                                                                                                                                                                                                                                                     |

This is a bounded source inventory, not a complete implementation estimate. Local callbacks,
mirrored tests, packed consumers and generated public reference declarations are additional
work. The helpers are exported today; changing their return contracts requires an explicit
API migration, not a patch advertised as invisible to consumers.

Existing async boundaries can retain their return contracts: `buildProject`, `checkProject`,
`runPerf`, `composePage`, `composeTemplate` and `renderAssembly`. Resource callbacks would need
awaiting before serialization. `registerResources` itself can stay synchronous, as can
`registerAuthoringTools` and `createMcpServer`. `answering` already awaits tool results, and the
installed MCP SDK accepts Promise-returning resource callbacks.

## Preservation work a migration would require

- Await compiler operations inside the existing try blocks so their catches handle rejections. `readViewPlacements`,
  `readViewExport`, config `readOr` and shape readers currently turn specified failures into
  findings or unread markers. Returning a Promise directly from those catches changes behavior.
- Resolve map/array entries before reading booleans, accessing placements or serializing shapes.
  Collect diagnostics in original source order; concurrent pushes would change that order.
- Keep core's `placedBeneath` state callback synchronous. Pre-read the Lit shadow-root flags;
  passing an async callback makes Promise objects truthy and corrupts its decisions.
- Await MCP descriptions before `answer` and before checking an assembly was found. A Promise
  must not be serialized as an empty project object or mistaken for an existing assembly.
- Finish placement-cycle validation before writes. Review the new suspension window for stale
  project/file reads and concurrent edits; a source API migration does not establish the later
  Academy approval/atomicity contract.
- Keep root confinement, non-execution of project source, invalid syntax, type/value exports,
  aliases, computed fields and all framework placement/element checks. Add actual rejection and
  ordering regressions rather than relying on compilation of a happy-path fixture.

## Concrete alternatives and costs

1. Reuse async esbuild throughout inspection. No second compiler dependency is required, and
   the existing compiler semantics can be tested directly. The cost is the public-helper API
   migration above, its callers/tests/docs, exact-source full CI and a new current-source packed
   browser proof. Published next.2 cannot be changed by such a source commit.
2. Retain the existing framework APIs and qualify a runtime with correct synchronous compiler
   support. This avoids that API migration but needs a justified runtime repair or another
   bounded candidate, followed by actual installation/check/build/preview proof and complete
   notice inventory. Current preview failures and licence gaps do not disappear.

Neither option is selected here. A private compiler fork, silent skipped checks, unbounded
runtime retries, paid hosting or a required paid runtime are not proposed substitutes. Continue
independent Academy curriculum/interface research while the implementation route is evaluated.
