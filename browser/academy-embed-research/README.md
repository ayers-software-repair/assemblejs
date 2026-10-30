# Hosted public editor SDK research

This is a bounded evaluation of StackBlitz editor SDK 1.11.1, not direct WebContainer API
embedding, Academy implementation or a selected production runtime. Official documentation
and the cost constraint are recorded in `docs/studies/academy-runtime-research.md`.
No account, saved project, vendor submission, paid hosting or model inference is used.

The supplied ephemeral Node project runs its own startup script. That script invokes the
published next.2 CLI to scaffold a project, installs exact React peers, adds an assembly,
requires the missing-assembly check to fail, repairs it and runs check plus build/typecheck.
It writes actual command exits and bounded output to a supplied project file. The controller
reads this through the documented VM snapshot API; it invents no SDK process method.

The browser checks real React hydration, then modifies the actual source through the VM API
and requires the dev preview to show the edit. A stop-control file asks the supplied startup
script to stop its dev process and record the observed exit/signal. Closing the browser also
disposes the embed. Every command, test and job has a deadline; one worker, no retries.
The GET-only fixture exposes only the SDK bundle and its own three resources.

The framework's framing default is unchanged. Only this project adds the exact controller
origin and documented StackBlitz editor origin to its existing frame-ancestor policy.
The normal framework browser suite is unchanged. Run this proof only in its hosted workflow,
never on the desktop seat. JSON, screenshot and failure trace are retained as artifacts.

Snapshot followed by file replacement does not demonstrate atomic approval or safe concurrent
editing. This probe also does not establish all six frameworks, two-server SDK previews,
saved-state recovery, external-agent connection, native mobile editing or production terms
coverage. Report actual failures; no result is a successful Academy merely because it embeds.
