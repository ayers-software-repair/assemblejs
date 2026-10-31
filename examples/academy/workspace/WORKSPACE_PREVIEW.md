# Supplied-project workspace and genuine preview

Source increment in progress after merged PR43. This combines the accepted guided calculator
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
uses saved project files, not unsaved buffers. Destroy removes UI and guards late results;
the caller still owns runtime shutdown and any already dispatched project operation.

The embedding server must enforce CSP frame-src at the pinned origin, including redirects
and later navigation; URL validation alone cannot supply that boundary. The hosted fixture
enforces it. The frame is restricted to the pinned different origin, with scripts, same-origin access for
its own application and forms. It receives no top-navigation, popup or download permission.
[MDN's iframe guidance](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#sandbox)
explains why script permission plus same-origin permission must not share the parent's origin.
These browser boundaries do not sandbox a Node process or authorize public untrusted execution.

The hosted-only adapter is being added to the existing modes fixture. It uses real CLI builds
and owned Node processes for the four actual Market servers. Abort and readiness deadlines
use the documented [Node 22 cancellation APIs](https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/globals.md)
and [child-process lifecycle](https://raw.githubusercontent.com/nodejs/node/v22.x/doc/api/child_process.md). Its copied project opts into
framing by the exact workspace origin through the existing contentSecurityPolicy configuration;
all other default directives and the framework defaults remain. It must preserve the parent
frame-src restriction, exact Origin check on writing/build endpoints, actual response/status
checks, bounded process startup/build/shutdown and cleanup evidence. No blanket CSP removal,
fake successful preview, local app server/browser or new vendor-runtime experiment is permitted.

Current proof: seven source/DOM workspace cases and existing editor cases pass. Actual hosted
application/quote/composition behavior, Stop and shutdown-during-build proof, independent source
review and personal visual review are still pending. Full curriculum, progress/resume,
certificate and verified external-agent connection remain open.
