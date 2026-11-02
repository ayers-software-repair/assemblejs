# Hosted built-preview research

Pending evaluation of actual published next.2 server output in exact Vivari 1.1.4. This reuses
the bounded installation/check/build fixture; it does not select or deploy a product runtime.
Run browser/server proof only in its separate hosted workflow.

Only this fresh temporary CI origin registers the SDK service worker. The provided project's
policy retains its defaults and allows the four exact static SDK preview scripts by SHA-256.
The hash extractor accepts static literals only; missing, dynamic or duplicate definitions
fail. No SDK code is evaluated to calculate those hashes.

The browser test requires a real 200 preview document and its CSP, all six framework mounts,
five rendered templates, and an actual React count changing from 0 to 1. Stop must yield the
server's real exit 143 through SDK worker termination before runtime teardown; graceful
signal handling is not established. Cleanup unregisters the temporary service
worker, then closes the page and fixture. Page/console errors and failed network responses
remain strict. A bounded screenshot is attempted in `finally` even on earlier failure;
capture failure is recorded. Final JSON and failure trace are retained.

Node boundary tests cover normal stop, failed launch and early process exit, including
cancellation of the readiness listener. They were watched failing without that cancellation
before the fix passed. Those tests do not execute the SDK or establish browser compatibility.

Same-origin preview here is an isolated research setup, not production isolation approval.
Bundled notices, multi-server composition, persistence, stale approval/atomic writes and
live external-agent transport remain separate requirements.
