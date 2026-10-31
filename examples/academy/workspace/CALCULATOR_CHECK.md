# Saved calculator output check

After Check & preview, Verify calculator compares saved authored settings with actual server
output and quote replies. It does not infer success from a frame load or operation receipt.
A successful result identifies the observed source revision and records each quoted quantity,
server price and real stock messages. It does not assert browser hydration, complete a lesson,
persist progress or unlock a certificate. The existing hosted interaction tests remain separate.

## Reuse and guards

The workspace retains the successful preview's URL and source version. Verification reuses
that successful check/build rather than running them again. It reads the actual source version,
reads the calculator through the existing guarded provider, checks its full authored body and
supported settings, asks the runtime for evidence, then reads the version again. Both versions
must equal the preview's version and the evidence must name that exact preview URL.

Writes, Stop and a new preview operation invalidate the visible result. Failed verification
removes the stale/unverified frame and retains actual diagnostics and all source. Destroy
aborts the browser inspection request and prevents later reads/results. Preview operations and
source writes cannot overlap verification through this workspace. Outside edits are detected
at observations, not atomically: edit-and-revert races and dependency/environment/remote
changes are outside the source fingerprint. This is point-in-time evidence, not a snapshot.

The output comparison uses a detached template and never adopts returned nodes into the
workspace. The [HTML Standard](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element)
defines the separate inert document owning template contents. Tests reject comment/script/
nested-template lookalikes, duplicated/failed assemblies, changed titles/presets and malformed
quotes. No source markup is evaluated or displayed as authoring UI.

## Runtime evidence contract

The private runtime adapter adds `inspect(values, signal)` to its existing origin/rebuild/stop
operations. It returns the actual page URL, served HTML and ordered `{ quantity, status, body }`
quote receipts. The browser checks title/accessible label and quantity buttons against saved
source, then validates each actual quote's item, quantity, safe integer price/total and messages.
Stock warnings remain real messages; requesting a quote does not reserve stock or add a basket.

The hosted-only adapter pins the existing owned loopback Market server, product
`/p/kb-guji-250` and `/api/quote`; callers cannot choose URLs or files. Its HTTP bridge requires
the exact parent Origin and only quantity options. Quantities are one to six unique integers
from 1 to 99. Redirects refuse; HTML is limited to 512 KiB, each JSON reply to 16 KiB, and the
whole inspection to ten seconds. It requires HTML/JSON response types. Owned runtime close
aborts inspection and waits for it. Inspection records distinguish receiving evidence from
validating its contents: a received bad price must still fail the browser comparison.

## Proof checkpoint

All 116 source/DOM cases and six source-only backend cases pass. Deliberately bypassing title
comparison and source-version comparison produced genuine missing-refusal failures before
restoration. Static gates and fresh native source/probe/docs review pass; personal acceptance and actual
hosted proof remain pending.
The new hosted scenario checks real quotes without rebuilding/writing, an actual outside edit
during inspection, an API returning an incorrect price, source correction/recovery, keyboard,
narrow layout and Stop. Unchanged runtime/framework matrices are not manually repeated.

PR33 remains held; this adapter is not a production sandbox or final browser-runtime choice.
Full curriculum, durable progress/certificate checks and verified external-agent access remain
open. No local product build, app server or browser is run for this slice.
