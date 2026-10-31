# Awaiting source inspection

The inspection API now uses asynchronous esbuild transforms. CLI verbs and MCP wire results
keep their existing behavior; callers of the exported helpers below must await their results.
This is a breaking tooling API change, approved by the owner before implementation. It adds
no parser dependency, does not execute project source, and does not select a browser runtime.

| package        | helpers now returning Promises                                                                                                                                                                                                                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@asmjs/build` | `scriptPlacements`, `readViewPlacements`, `viewFindings`                                                                                                                                                                                                                                                                                                                      |
| `@asmjs/check` | `readDefaultExport`, `readNamedExport`, `scriptElements`, `readPagePolicy`, `pageRoute`, `readApi`, `notFoundRouteProblems`, `declaredOrigins`, `readBudgets`, `readAddresses`, `readViewExport`, `readViewMount`, `hasBrowserHalf`, `viewProblems`, `readViewElements`, `viewElements`, `elementProblems`, `readPageShape`, `readApiShape`, `readSettingsShape`, `readShape` |
| `@asmjs/mcp`   | `describeProject`, `describeAssembly`, `projectAssemblies`, `placeInView`                                                                                                                                                                                                                                                                                                     |

For example:

```ts
import { readShape } from "@asmjs/check";

const project = await readShape(root);
```

Await inside a try block if its catch handles inspection failures. Passing an unresolved
Promise into JSON serialization, a Map, a boolean condition or a synchronous traversal changes
the result. Resolve collections before consuming them; the framework retains diagnostic order.
`registerResources`, `registerAuthoringTools` and `createMcpServer` retain synchronous signatures;
the resource callbacks await descriptions before serializing them.

Placement inspection captures confined module lists and source text before its first compiler
await, so a transient edit reverted during compilation cannot change the validated graph.

Compiler syntax diagnostics retain their text and source positions. Existing wrappers continue
to turn the same specified failures into unread markers or findings. Source inspection remains
static: declarations are not imported or evaluated. Application bundling still uses esbuild.

`placeInView` checks its placement-source snapshot after asynchronous validation and refuses
writes if those inputs changed. This guards the newly introduced suspension window; it is not
a multi-file transaction or the Academy approval/atomicity contract.

The workspace packages migrate together through the existing fixed version group. There is no
second synchronous implementation or alternate compiler. A source revert before publication
is the rollback; no project data format is migrated. Publication and runtime adoption require
separate authority and proof. Published next.2 packages are not changed by this source work.
