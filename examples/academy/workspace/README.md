# Academy source editor

This is the source-editor part of the supplied-project workspace, not a delivered Academy
or a selected browser runtime. It preserves the existing read-only inspector. No upload,
agent connection, project build, preview, lesson completion or saved-progress claim follows.

`createSourceEditor(container, project, paths)` mounts a file list, open-file navigation,
highlighted editable source and explicit Save. Load `source-editor.css` with the application.
The component uses an ordinary textarea: Tab leaves it, native selection/copy/undo remain
available, and forced-colors mode shows native source text. The highlighted layer is hidden
from assistive technology and receives escaped source, never user HTML.

The project provider owns the real shared filesystem:

- `readFile(path)` resolves to the current source string.
- `writeFile(path, after, before)` writes only if the actual file still matches `before`.
  It must reject conflicts and storage failures. A separate asynchronous preflight read is
  insufficient to promise an atomic compare-and-write. This component supplies no filesystem
  lock or cross-process transaction and must not be wired to an unconditional overwrite API.
- `paths` is the supplied project's confined source allowlist, excluding secrets and generated
  files. It is not a repository-import or arbitrary-host-file interface.

The editor retains per-file buffers through navigation. Opening/editing does not write.
A successful save advances only that buffer's base; edits typed while saving remain dirty.
Failed saves retain the learner's draft and show the actual error. Saving does not run checks
or claim that a visible preview is current. The combined code/guidance/preview is described in
[WORKSPACE_PREVIEW.md](WORKSPACE_PREVIEW.md). Full curriculum checks, durable project/progress
persistence and a verified external-agent connection remain open.

Focused Node/DOM/request cases cover actual temporary files. They cover saved bytes, stale-save
refusal, in-flight edits, failed writes, retained tabs, late reads, markup escaping, disposal and split UTF-8 input.
The hosted `academy source editor` job bundles the actual component and opens real copied
Market calculator files through a bounded test-only HTTP provider. It verifies actual saved
bytes, keyboard exit, narrow layout and a deliberate 409 conflict with the outside edit kept.
That provider is a CI fixture, not a production file-writing server or runtime substitute.
Desktop/narrow screenshots and strict browser diagnostics are retained for visual review.

Highlighting uses only the required grammars from Highlight.js. Its documented text API and
modular imports are <https://highlightjs.readthedocs.io/en/latest/api.html#highlight> and
<https://highlightjs.readthedocs.io/en/latest/readme.html#importing-the-library>.

The first hosted editor run (`41161507063`, head `84de3c8`) reached saved bytes,
keyboard exit, desktop/narrow captures and stale refusal, but its strict request check caught
`net::ERR_ABORTED` for the successful 204 save response. The test provider now consumes and
validates an explicit successful response body before resolving a save. Three focused
transport cases enforce body completion, the real failure diagnostic and an acknowledgement;
the strict browser failure assertion is unchanged. Hosted acceptance still governs.

Targeted narrow metrics then reproduced a clipped first line (`41162669536`, `9b64b49`):
the caret was at zero but both aligned layers retained scrollTop 19; the first painted span
started above its viewport. The source editor normalizes Home at the first character to
scrollTop/Left zero without changing the buffer. The actual first-line visibility assertion
remains strict; the small keyboard regression was watched failing before this correction.

## Shared source-tool provider

`createProjectFiles(client)` adapts an already connected MCP client to this editor contract:

```js
const project = createProjectFiles(client);
createSourceEditor(container, project, suppliedSourcePaths);
```

It reads through `read_source` and sends each explicit Save as one `apply_source_changes`
request containing the retained before/after values. Only a matching successful acknowledgement
advances the editor base. Missing/failed reads never become empty writable buffers. Storage
refusals and partial-result details reach the editor while the draft is kept. This adapter
adds no transport, credentials, runtime or inferred mode/approval: manual Save is explicit.
The shared tools guard observed stale bases, not hostile filesystem races or a global atomic
transaction. The caller still owns its confined path list and actual connection.

Four focused provider cases cover the exact protocol requests, invalid/missing reads, retained
drafts and malformed write acknowledgements. The acknowledgement control is red when validation
is removed and green when restored. The existing hosted modes fixture adds an isolated editor
route over the actual MCP server and canonical project. Its browser proof checks actual saved
bytes and an outside edit through the real tools. The provider was accepted in PR42 and
later source increments retain that real-filesystem proof.

The authored Market calculator controls and their bounded request grammar are described in
[CALCULATOR_WORKFLOW.md](CALCULATOR_WORKFLOW.md). The editor also provides an explicit clean
Reload file action for changes made through those shared tools. Unsaved drafts cannot be
reloaded away; edits typed during the read are retained. This is an explicit refresh, not an
automatic agent-notification subscription or a verified production connection.

## Recover an unsaved draft after reload

The editor keeps bounded draft/base text for reload in this tab and workspace URL using
[sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage).
Closing the tab ends that storage; this is not durable project or lesson-progress saving.
Only the supplied paths are used, with at most 65536 UTF-8 bytes per base or draft value.
Opening a matching-base draft restores the editor buffer without writing a project file.
Save remains explicit and uses the original expected base; a later outside change still refuses.

If the actual source changed, the current file stays in the editor and the recovered draft
appears separately as read-only text. Copy/review it and merge manually. Discard recovered draft
removes that stored copy only; any current edits can then be kept for reload. No recovery path
rebases a stale draft or applies it automatically. Denied reads and malformed records stay
blocked rather than being overwritten by subsequent typing. Quota/storage errors keep useful
text in memory and display the actual error without claiming the latest draft was persisted.
A successful project Save remains valid even if draft storage is unavailable.

Eight focused recovery cases cover matching/conflicting bases, malformed/bounded storage,
denial, quota, late edits during Save and redundant cached text. The matching-recovery and
error-message regressions were watched failing before correction. Three hosted actual-MCP
scenarios must prove real page reload, no writes before Save, conflict selection/review and manual
merge, keyboard/narrow layout and denied/quota handling. Fresh hosted and independent/personal acceptance
remain required for this source increment. No local product build, server or browser ran.
