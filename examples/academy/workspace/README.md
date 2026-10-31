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
or claim that a visible preview is current. The final workspace still needs the real provider,
mode/diff controls, lesson checks, persistence and live-agent transport.

Seventeen focused Node/DOM/request cases use actual temporary files. They cover saved bytes, stale-save
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
