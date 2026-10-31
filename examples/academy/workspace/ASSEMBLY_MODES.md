# Assembly authoring controls

`createAssemblyControls(container, client)` presents Plan, Approval and Auto over the existing
MCP `plan_assembly`, `discard_assembly_plan`, `apply_assembly_plan` and `check` tools.
`client.callTool` is the actual connected MCP client's method. This component does not create
an external-agent connection, obtain credentials or implement an alternative authoring engine.
Load `assembly-controls.css` with the surrounding application.

Plan shows the exact retained new-file additions without writing. Approval exposes explicit
approve/reject actions; rejecting discards the id, and a revised proposal receives a new id.
Auto obtains a new proposal for the next request, applies it and runs the real project check.
Changing mode never applies an existing proposal. In-flight operations block a second request
or mode change. A failed/ambiguous apply consumes local permission and requires a fresh plan;
partial-write diagnostics remain visible. Check failure is reported after application rather
than undoing or concealing the applied files.

These shared tools currently create a new assembly scaffold. They do not yet implement the
complete authored calculator feature or edits to existing files. Placement, build, preview,
lesson proof, saved progress, external-agent transport and runtime acceptance remain open.
The control states this boundary after a successful check. No lesson completes because a
button was clicked. Destroy removes the panel; it does not cancel a previously dispatched
project operation. The surrounding workspace must retain its operation state when navigating.

Sixteen focused protocol/controller/DOM cases verify consent, call ordering, rejection,
revised ids, malformed replies/acknowledgements, actual failure results, ambiguous writes and escaped diffs.
These boundary clients are not proof of filesystem or MCP compatibility. Hosted proof
instantiates the real built MCP server/client over in-memory protocol transports, creates an
actual canonical project and exposes only the four authoring/check tools to its disposable
browser page. It verifies no planned/rejected writes, exact approved file bytes, Auto's real
check and refusal of an outside edit, retaining the actual tool-call trace and screenshots.
This bounded fixture is not a production HTTP bridge or a verified external-agent connection.
