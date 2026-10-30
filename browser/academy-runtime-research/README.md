# Hosted runtime compatibility research

This isolated prototype tests whether published AssembleJS next.2 packages can install,
check, build, typecheck and hydrate in WebContainer API 1.6.4. It is not Academy, a selected
runtime or production licence acceptance. No model API key or inference is used.

The dedicated GitHub workflow runs on hosted Linux. It uses the repository's frozen
development dependencies and one worker; the existing browser suite stays separate.
Do not run this browser proof on the desktop seat.

The probe scaffolds an actual project with the published CLI, pins its framework packages
and tested renderer peers, then generates six framework and five template assemblies.
It places a missing assembly and requires the real check to fail before repairing the page,
checking again and running the project's build/typecheck. The browser then verifies the
rendered content and all six framework mounts. Two processes run the same build on distinct
ports: the page server composes a required React assembly from the other server's actual
SDK origin. Its remote origin and mounted state are checked in the browser. Stop awaits both
server exits before tearing down the runtime.

The generated project opts into framing by the exact ephemeral research-controller origin
through the existing `contentSecurityPolicy` project setting and public default-policy
function. All other default directives remain. The framework's default policy is unchanged;
this is proof of an explicitly configured preview, not arbitrary cross-origin framing.

Commands retain real exit codes, timeout state and bounded output in a JSON file and attachment.
Failures retain the final state and Playwright trace. The overall test and job also have
deadlines, and the fixture/browser are closed on failures.

This controlled probe does not establish independently built projects, api relay, streams,
edit/rebuild, saved-state recovery, native mobile editing or connection to an existing agent.
Those remain separate acceptance work even if this probe passes.
