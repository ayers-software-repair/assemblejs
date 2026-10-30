# Workspace source inventory

Read 30 October 2026 at the Academy branch's next.2 base. This is source research for the
owner's optional visual workspace, not an implementation or a selected architecture.

## Existing inspection UI

`packages/devtools/src/devtools/devtools.ts` returns three GET routes: overview, stylesheet
and project JSON. `overview/render-overview.ts` renders escaped server-side HTML tables.
Its test forbids scripts, forms, buttons and inputs; there is no existing editor or browser
application bundle. `overview/overview-stylesheet.ts` is a standalone stylesheet string.

The public contract is deliberately read-only:

- `packages/core/src/devtools/devtools-route.ts`: method is literally GET.
- `packages/core/src/devtools/devtools-view.ts`: field-filtered project summary and bounded
  failures, without a project-root, source-file or write interface. Failure messages/stacks
  are length-bounded, not redacted (`server/recent-failures.ts`); they can contain paths or
  sensitive error details. HTML escaping prevents markup execution, not disclosure. This
  loopback-only diagnostic data is not suitable for a public Academy response unchanged.
- `packages/core/src/server/devtools-writes.ts`: every route under the devtools prefix is
  checked, including plugin routes. A non-read route is a boot problem.
- `packages/core/src/server/create-server.ts`: refuses these problems before listening.
- `packages/core/src/server/register-devtools.ts`: development only, both Host and connection
  address loopback checks, no-store responses.
- `docs/DESIGN.md`, devtools section, and PLAN B-19 state the same boundary.

Do not make this inspector writable by weakening its gate. Actual editing/application needs
an explicit workspace contract, tested separately from the existing read-only contract.

## Existing operations and lifecycle

- `packages/cli/src/commands/plan-assembly.ts` returns proposed files and placement tag without
  writing. CLI and MCP already share this decision. Its validation rejects unusable names,
  unknown renderers and an existing assembly.
- `packages/build/src/io/io.ts` describes writes/output. `realIo` writes directly; it is not
  an approval transaction, diff engine or concurrent-edit guard.
- `packages/cli/src/run/run.ts` dispatches dev to `runDev`; no workspace command exists.
- `packages/build/src/dev/run-dev.ts` watches source/config, folds changes, preserves the last
  good build and restarts successful current builds. Discovery is `.assemblejs/dev.json`.
- `packages/core/src/server/dev-reload-source.ts` refreshes the browser through SSE when the
  server boot changes. It is preview reload, not source editing.
- Project discovery, check, rendering and composition already exist behind CLI/MCP operations.
  Reuse them rather than rebuilding a tutorial-specific version of the framework.
- `examples/two-frameworks/src/server.ts` explicitly opts into the existing inspector.
- `packages/core/src/outline/outline.ts` supplies a framework-free composition/hydration
  inspection overlay in its own shadow root; it does not edit source.

## Existing visual primitives

`packages/cli/src/commands/tokens.ts` and `components.ts` provide project tokens and accessible
native controls, tables, notices and dialogs. The build writes hashed global stylesheets,
tokens first (`packages/build/src/styles/write-project-styles.ts`). These are reuse candidates,
not a claim that they already supply a coding workspace.

Default CSP (`packages/core/src/access/content-security-policy.ts`) allows same-origin
external scripts/styles, forbids inline execution and permits same-origin framing. A new
editor/runtime must account for actual policy; a broad relaxation is not implied.

## Missing behavior

Source browsing/editing, readable diffs, Plan/Approval/Auto state, conflict-safe application,
rollback, learner progress and browser-triggered authoring are not existing devtools features.
Prepared demo actions must operate on real project files through shared framework operations.
Approval must apply the change that was actually reviewed; rejection must leave the project
unchanged. Concurrent manual/agent edits cannot silently be overwritten.

Independent source reader inspected complete devtools implementations/tests and relevant
runtime/dev/generation callers. Parent also read the route/view types, write gate, factory
and assembly planning function. No implementation, runtime or tests ran for this inventory.
