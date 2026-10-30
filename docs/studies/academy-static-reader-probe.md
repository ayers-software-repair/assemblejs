# Static-reader candidate: not adopted

Status: both published next.2 preview attempts failed; the source-level compiler replacement
was also rejected after a valid-syntax counterexample. This checkpoint changes evidence only.
No preview, package compatibility, runtime adoption or production licence acceptance follows.

## Published next.2 preview failures

The separate draft PR27 keeps the complete bounded preview experiment. Both attempts stopped
at config reading after installation, TypeScript compiler rejection/recovery and eleven
assembly additions. Build, server, preview policy, mounts, counter interaction and Stop were
not reached. Strict browser/network checks stayed enabled; service-worker cleanup was 1 to 0.

| source                                     | run and artifact                                                                                                    | actual failure                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `9bcadd597df8b18d7892129ea30e8195f33aeb62` | [41130937926](https://github.com/ayers-software-repair/assemblejs/actions/runs/41130937926), artifact `13012927422` | `receiveMessageOnPort` returned undefined during config reading                                    |
| `15172907d02293e21dbfdaaaacf164f98a881d18` | [41132275246](https://github.com/ayers-software-repair/assemblejs/actions/runs/41132275246), artifact `13014255790` | With recorded `ESBUILD_WORKER_THREADS=0`, repaired check still exited 1: `The service was stopped` |

Raw ZIP SHA256, first and second respectively:

```text
9494c1aaa5d8059884a9585f5c8fd06f77ee8793aba3f3591333b1abe748a8c0
7c7ccdf72c659bb0fa13bf271e9b514853141218d5f43604dd78685ce1077d2f
```

A separate source/artifact reader verified both negative results. The precise reason the
fallback service stopped is unproven; binary transport concerns are not a demonstrated cause.
Do not retry unchanged or bypass config/security checks to obtain a preview pass.

## The owned-source candidate and why it stops

`readDefaultExport`, `readNamedExport`, `scriptElements` and `scriptPlacements` use synchronous
esbuild transformation before Acorn parsing. A local candidate shared that preparation through
TypeScript 6.0.3 `transpileModule`, preserving the existing non-executing AST readers. The
[official compiler API guide](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#a-simple-transform-function)
documents string transformation; [automatic JSX output](https://www.typescriptlang.org/tsconfig/jsx.html)
and [value-module preservation](https://www.typescriptlang.org/tsconfig/verbatimModuleSyntax.html)
were checked against the installed sources too. No vendor code was changed.

The candidate requested diagnostics, rejected error diagnostics despite recovered output,
lowered automatic JSX, normalized Acorn failures into the existing `errors[]` contract and
removed emitted coordinates rather than inventing original source lines. Exported variable
wrappers needed handling in the existing alias resolver. A source-alias Vitest configuration
ran only these readers and the shared parser, without global setup or framework builds.

Actual red/green observations:

- Original default-export tests failed three assertions when synchronous esbuild was unavailable.
- A first transpiler candidate erased an invalid duplicate value export. With
  `verbatimModuleSyntax: true`, Acorn rejected it and that regression passed.
- Exported-default and named-alias cases failed two assertions before the alias resolver was
  corrected. The resulting focused set passed 28 tests across six files, independently rerun.
- Additional valid type-export cases below failed, independently reproduced. Those failures
  invalidate parity despite the green focused set. No full source CI or browser acceptance of
  the candidate was claimed.

Both of these are accepted by the existing esbuild 0.28.2 static transform, which removes the
local type declaration and type-only export:

```ts
interface Config {
  port: number;
}
export { Config };
export default { port: 3210 };
```

```ts
type Mount = "idle";
export { Mount };
export const mount = "idle";
```

The candidate with value-module preservation erases each declaration but retains its export;
Acorn then rejects `Config` or `Mount` as undefined. TypeScript reports no error diagnostics.
Turning preservation off accepts those examples, but also erases the invalid value duplicate
below, which the existing esbuild rejects:

```ts
export const x = 1;
export { x };
```

`ModuleKind.Preserve` was checked too and did not resolve that conflict. Further compiler or
parser changes need their own justified scope and preservation proof. This preview investigation
does not justify accepting invalid modules, rejecting valid source or maintaining a private
compiler fork. Owned package, dependency, lockfile and changeset edits were removed from the
checkpoint; all four existing compiler calls remain unchanged.

## Cost and retained experiment

The proposed dependency would add TypeScript to the build tooling, approximately 24 MB unpacked
in this checkout. It loaded only on first inspection. One local Node 24.18.1 parser-only sample:
first inspection 141 ms; 100 further TypeScript inspections 89 ms; 100 esbuild transforms 76 ms.
These are single observations, not browser performance guarantees or a reason to accept the
syntax regression. No local app server, browser or framework build was started.

The rejected source/test/package candidate is retained locally in
`/tmp/assemblejs-static-reader-rejected-candidate.tgz`, with tracked edits also in the sibling
`.patch`. The archive's SHA256 is recorded in the review handoff. It is disposable research,
not a committed package change; the counterexamples and conclusions above are the durable record.

Full Academy interface/curriculum work, browser-runtime evaluation, notice inventory and live
agent transport remain open. No release, registry publication, new hosting, stable promotion
or final runtime selection is authorized here.
