# Built preview probe: pending

Accepted issue 16; no product deployment or runtime adoption. The preceding package/build
proof is merged as `2e1d0cf` after personal review and eight exact-head checks at `6e59ea2`.
This next hosted-only experiment reuses its actual published next.2 project and SDK 1.1.4.

The SDK's published `assets/sw.js` injects four fixed NET/TITLE/WS/SSE script strings into
preview HTML. Parse those static literals without executing SDK code and hash their exact
values. Only the generated research project's existing script directive gains those four
hashes; other default policy directives remain. The test requires the returned preview
document's hashes and self framing, with no unsafe-inline script allowance. Dynamic or
incomplete inventories are refused by a known-bad Node test.

The service worker is served at the root of this disposable CI origin, with explicit no
Document-Isolation-Policy and preview devtools disabled. It is never registered on the
product/company origin. Default package/mechanics scenarios still disable service workers.
The shared GET/path guards remain, with explicit own-file routes rather than file-identity
exceptions that could permit an encoded traversal alias.

After the real install/check/compiler/build steps, start `dist/server.js` on port 3210.
Wait for the public SDK's serving event, load its actual preview URL, require all six mounts
and five templates, then click a real React counter and observe its changed state. Server
readiness is distinct from successful browser interaction. Stop must report actual exit 143
and drain output before teardown. The SDK terminates its worker; this does not prove graceful
signal handling. Unregister the temporary service worker and close the page and fixture even
on failure. Retain state, policy, errors and cleanup result; attempt a bounded screenshot in
`finally`, recording capture failure rather than masking the original test failure.

The readiness listener is cancellable even if spawn fails. A Node test using mocked lifecycle
boundaries was watched failing for launch/early-exit cleanup before passing with cancellation.
No local browser/server/framework build runs. The hosted test has six minutes, the job ten,
one worker and no retries. This does not establish production isolation, pending-operation
cleanup in general, bundled notice completeness, persistence, atomic approval or agent access.

## First hosted result

At `9bcadd597df8b18d7892129ea30e8195f33aeb62`, run `41130937926`, job `124321346943`,
the preview test failed after 1.8 minutes, before build or server startup. Artifact
`13012927422` has SHA-256
`9494c1aaa5d8059884a9585f5c8fd06f77ee8793aba3f3591333b1abe748a8c0`.
A separate reader verified the raw artifact and exact synthetic merge/source tree match.

Installation, compiler error/recovery and eleven additions succeeded. Reading the new
project config through the real checker failed in esbuild's synchronous worker service:
`receiveMessageOnPort()` returned undefined after its wait. The deliberate missing-assembly
case retained both problems; its repair still returned the config problem and exit 1.
No preview document, mount, interaction or stop was reached. Page/network arrays are empty;
the screenshot exists and SW cleanup records 1 to 0.

The actual downloaded esbuild-wasm 0.28.2 source supports `ESBUILD_WORKER_THREADS=0`,
which sends synchronous transformation through its `execFileSync` service instead of worker
message polling. The pinned SDK implements synchronous child spawning, but its output
transport's byte fidelity and nonzero-error handling remain unproven. One controlled next
probe sets that variable before preview CLI imports and records it in command evidence;
the ordinary package scenario remains unchanged. No vendor patch or checker bypass is made.
The runtime's existing async esbuild service patch does not establish this sync fallback.
