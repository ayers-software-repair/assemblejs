# Supplied-project workspace and genuine preview

Accepted workspace foundation from PR44, extended by PR49 source-identity checks. It combines the guided calculator
and source editor beside an actual application URL. It is not a selected browser runtime,
publicly delivered Academy, production MCP bridge or safe multi-tenant execution service.
PR33's browser-runtime failure and final adoption hold remain unchanged.

`createAcademyWorkspace(container, client, recipe, paths, runtime)` requires the connected
project client, actual supplied Market recipe/source paths, and an actual runtime controller:

- `origin`: one pinned HTTP(S) origin, distinct from the workspace origin, without credentials
  or a path. An HTTPS workspace also requires HTTPS preview.
- `rebuild()`: resolve with a URL at that origin only after the real current-project build and
  server readiness succeed; reject actual build/start failures.
- `stop()`: resolve after owned preview processes stop; retain source files.

The workspace checks saved files before requesting a build. Failed/malformed checks cannot
start a preview. The frame uses the genuine URL, never srcdoc or substitute markup. Its load
event is not treated as successful rendering: browsers fire it even for failed loads, as
[MDN documents](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#error_and_load_event_behavior).
The UI says the preview was requested; framework behavior and lesson completion require actual
checks beyond that acknowledgement.

Confirmed written paths join the code tree. Source writes through either control invalidate the displayed preview and reload only clean,
already opened changed files. Dirty drafts remain intact. Preview/check operations serialize
this workspace's writes; external agent/CLI notifications are not yet implemented. The preview
uses saved project files, not unsaved buffers. The editor's tab-local draft recovery restores
only a matching-base buffer and exposes conflicts separately; it does not rebuild or write
project files. See [the editor contract](README.md#recover-an-unsaved-draft-after-reload). Destroy removes UI and guards late results;
the caller still owns runtime shutdown and any already dispatched project operation.

The embedding server must enforce CSP frame-src at the pinned origin, including redirects
and later navigation; URL validation alone cannot supply that boundary. The hosted fixture
enforces it. The frame is restricted to the pinned different origin, with scripts, same-origin access for
its own application and forms. It receives no top-navigation, popup or download permission.
[MDN's iframe guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox)
explains why script permission plus same-origin permission must not share the parent's origin.
These browser boundaries do not sandbox a Node process or authorize public untrusted execution.

The hosted-only adapter runs in the existing modes fixture. It uses real CLI builds
and owned Node processes for the four actual Market servers. Abort and readiness deadlines
use the documented [Node 22 cancellation APIs](https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/globals.md)
and [child-process lifecycle](https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/child_process.md). Its copied project opts into
framing by the exact workspace origin through the existing contentSecurityPolicy configuration;
all other default directives and the framework defaults remain. It must preserve the parent
frame-src restriction, exact Origin check on writing/build endpoints, actual response/status
checks, bounded process startup/build/shutdown and cleanup evidence. No blanket CSP removal,
fake successful preview, local app server/browser or new vendor-runtime experiment is permitted.

PR44 merged as `d11c4b3` after independent/personal source and visual review plus all eight
exact-head jobs. Its hosted proof verifies real application/quote/composition behavior, six
builds, keyboard/narrow layout, Stop and shutdown during an actual in-flight CLI build.
PR49 merged as `805ce56` after all ten exact-head jobs and personal review; its additional
hosted scenario proves an outside source change refuses preview before building, followed by
stable-source recovery and cleanup. Post-merge CI/modes/editor also passed for both increments.
Full curriculum, progress/resume, certificate and verified external-agent connection remain open.

Preview refresh now observes the actual build fingerprint through `read_source_version`
before checking, after checking and after the real build. A changed or unavailable identity
refuses the preview request, keeps saved edits and retains diagnostics; an already started
runtime remains owned and can be stopped. Destroy during a pending identity read dispatches
no later check/build. Successful refresh returns the observed `version` with its URL.

This covers the connected project's source paths/bytes, config and package metadata, using
the build's existing identity function. Dependencies, environment and remote servers are outside
that fingerprint; no atomic snapshot, edit-and-revert detection or future-change notification
is claimed. These observations support later revision-bound checks; they are not themselves
lesson behavior evidence, durable progress, runtime adoption or certificate completion.
