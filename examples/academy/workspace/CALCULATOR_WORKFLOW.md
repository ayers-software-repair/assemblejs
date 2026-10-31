# Authored calculator workflow

This private Academy increment changes actual supplied Market source through the same MCP
source tools as the editor and agents. It is guided authoring, not a real AI model, selected
browser runtime, production connection or completed lesson/preview.

`createCalculatorControls(container, client, recipe)` shows a request field, supported examples,
Plan/Approval/Auto, complete before/after source and actual tool diagnostics. Load
`assembly-controls.css`. The client must already be connected. The recipe contains the four
canonical Market calculator files and its canonical `product.html`, read from the repository;
it is authored application content, not arbitrary learner-uploaded code.

Supported requests include:

- `Add a calculator`
- `Add a calculator called "Coffee total"`
- `Rename calculator to "Order total"`
- `Use presets 2, 4, 8`

Titles are quoted, nonempty and at most 60 characters; requests are at most 200 characters.
One to six unique integer presets from 1 to 99 are supported. Other requests stop before
source reads/writes and explain the supported forms and optional agent path. No model invents
code or chooses a framework: the authored explanation picks React beside the existing React
buy-box, reuses its service and the real `/api/quote`, and places the new assembly beside it.
The calculator implementation remains the actual Market feature, including quantity validation,
server-priced requests, abort/stale-response handling, stock warnings and basket independence.

## Modes and source ownership

Plan reads actual source and prepares four absent files plus a reviewed existing-page change.
Changing mode does not apply that pending plan. Reject clears it without a write. Approval
sends exactly the retained reviewed values; Auto obtains a fresh plan for the new request and
then applies/checks. A failed new request clears the old pending proposal. Any apply dispatch
consumes local permission; lost/partial/malformed replies cannot authorize a repeat. The tool
checks every base before writing and reports actual partial outcomes without promising rollback
or cross-process atomic compare-and-swap. Consent remains the client's responsibility.

Guided placement requires the exact supplied starter page: the canonical product page with
its one calculator placement removed. An altered page is refused. Customization requires the
canonical calculator body after normalizing only the supported title/preset settings; trailing
single-line comments are preserved. Unknown executable edits, changed layout or fake markers in
comments are refused. This bounded ownership avoids guessing at arbitrary JSX/HTML. Other
manual files remain untouched. Broader edits belong to manual work or the learner's agent.
Earlier curriculum exercises that change this page will need their own reviewed authored
baseline before this workflow can be counted as integrated lesson acceptance.

The editor's explicit Reload file reads actual current source into a clean idle buffer.
It is disabled for unsaved edits. A draft typed during a reload survives; concurrent reloads
are refused. It does not discard drafts or automatically refresh tabs on agent notifications.
Saving/reloading does not claim that checks or a visible preview are current.

## Proof boundary

Twenty-one focused request/plan/controller/DOM cases cover canonical file/placement proposals,
reject/revise/exact approval, fresh Auto requests, actual refusal/partial diagnostics, busy
serialization, escaped source and supported customization. Independent review found comment
markers mistaken for live code; three exact regressions were red before the authored-shape
restriction and pass afterward. Mode-switch auto-apply and reload-overwrite controls were
also observed red before restoring the guards. Existing buffer/editor cases include clean
reload and in-flight draft retention. Three selection regressions also cover same-file reselect,
away-and-back and another-file selection; the first two were watched reverting an agent edit
on a subsequent guarded Save before the active-file projection was corrected.

The hosted-only modes fixture copies the actual Market source/config/package metadata into
its disposable project, removes the calculator and placement, preserves generated agent-tool
metadata, and links the already installed Market/source-tooling dependencies into its own
dependency directory. Its bounded localhost transport exposes only the existing permitted MCP
tools. The new browser scenario exercises real planning, rejection, revised approval, Auto,
manual Save, stale approval refusal, refreshed review and clean Reload, with actual file bytes,
real project checks, screenshots and strict diagnostics. The first hosted run (`41170315559`,
`09b80fe`) applied all five reviewed files, then the real check refused a retained MCP registration whose dependency was dropped by the fixture's Market
manifest copy. The fixture now merges the generated declarations and installs real links,
including MCP, without changing that check. Auto/manual/stale/final Reload were not reached
in that failed run. Corrected hosted/personal acceptance is pending.
No local framework/product build, app server or browser runs on this seat. This source proof
starts no Market application server and substitutes no iframe for a framework preview.

Full lesson integration, live preview/build acceptance, runtime isolation/notices, verified
external-agent connection, persistence/resume and certificate gating remain open. PR33's
recorded current-source Svelte runtime failure remains held.
