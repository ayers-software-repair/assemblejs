# Academy lesson and proof proposal

Candidate learning path for accepted issue 16, based on the recorded tutorial/source research.
This is a reviewable proposal, not implemented lessons or a selected browser runtime.
The existing Market example supplies the connected application and composition behavior.

## Learning loop

Each lesson shows the outcome, one short task and its current check result. Keep the first
instruction to a few sentences; put optional explanation behind the guided tutor and links.
The tutor offers authored hints from the lesson and actual diagnostics. Unknown errors keep
their real diagnostic and an honest fallback. It does not claim arbitrary AI reasoning.

The learner always sees the actual application and can open its files. A file tree, tabs,
editable highlighted source and readable changed-file diffs support the work. A visible
keyboard route must leave the editor. Narrow layouts switch between conversation, code and
preview without losing unsaved work or the current task.

## Connected project

Use a supplied shop project that grows toward Market's existing multi-server application.
Introduce each concept in one small task; later tasks use what the learner already built.
Show other framework assemblies as functioning parts of the application rather than requiring
the learner to relearn every framework before understanding composition.

| Stage                         | Learner action                                                                    | Completion evidence required                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1. Explore the result         | Use the finished shop and inspect its composition.                                | Interact with the running page; identify a local assembly and an assembly from another server through actual composition data. |
| 2. Make a manual edit         | Change the supplied local assembly's content.                                     | The saved source and rebuilt preview both show the edit.                                                                       |
| 3. Add an assembly            | Add a small interactive assembly through the ordinary authoring operation.        | Expected files exist, check passes and the assembly renders/hydrates.                                                          |
| 4. Place it on a page         | Put the assembly in the existing page.                                            | Composition contains the intended placement; server-rendered output and browser behavior agree.                                |
| 5. Load product data          | Move supplied product data into the server-side service step.                     | Valid and missing product addresses produce their expected output.                                                             |
| 6. Plan a feature             | Ask the guided agent to add the calculator.                                       | A concrete file/change plan exists; file hashes and preview are unchanged.                                                     |
| 7. Review and reject          | Inspect the proposed calculator diff and reject it.                               | No proposed file/content is applied; project and preview remain unchanged.                                                     |
| 8. Revise and approve         | Change a supported requirement, inspect the revised diff and approve it.          | The applied content matches the reviewed proposal; real checks and calculator interactions pass.                               |
| 9. Use Auto                   | Request a supported calculator customization in Auto.                             | The actual files change, checks run and preview behavior matches the request.                                                  |
| 10. Mix workflows             | Save a manual or CLI edit while a proposal is pending.                            | Approval detects the stale base and requires a refreshed diff; it preserves the outside edit.                                  |
| 11. Connect frameworks        | Wire the local interactive assembly to another framework's assembly using events. | A user action updates the intended subscriber; independently rendered state stays coherent.                                    |
| 12. Compose across servers    | Place the supplied catalog assembly by its remote address.                        | The page contains the actual remote assembly and its assets, with correct hydration.                                           |
| 13. Handle a slow dependency  | Stop/delay a supplied optional remote.                                            | The expected bounded fallback appears; required content remains usable and failures are explained.                             |
| 14. Cache appropriate content | Apply the supplied cache policy and change its input.                             | Reuse and refresh are demonstrated against the real server behavior.                                                           |
| 15. Call a remote api         | Add a browser interaction using the page server's declared relay.                 | The real request reaches the intended remote api through the page server and updates the UI.                                   |
| 16. Validate a mutation       | Submit a valid and invalid synthetic shop action.                                 | Invalid input shows its real validation result, retains useful input and does not mutate state; valid input succeeds.          |
| 17. Stream stock              | Add the supplied stock stream to the composed page.                               | A stock change updates the running assembly; reconnect/stop cleanup follows the actual runtime contract.                       |
| 18. Inspect a failure         | Diagnose a deliberately broken placement or endpoint.                             | The current check/render/compose diagnostic identifies the problem; fixing it clears that same problem.                        |
| 19. Build the application     | Build and inspect the supplied multi-server application.                          | Actual build/check output, composition, framework hydration and representative end-to-end behavior pass.                       |
| 20. Complete the capstone     | Add and customize one supported feature using the preferred workflow.             | All required core checks pass on the current project revision; required earlier failures/recovery exercises are recorded.      |

Framework-specific extensions can use the existing six renderer examples and template views.
The core path teaches assembly boundaries and server composition; it does not pretend that
one framework is universally best. Prepared feature workflows explain their authored choice
and the supported alternatives. Requests outside those workflows receive a clear limitation
and the option to use the learner's real agent.

## The same project through every workflow

The optional visual workspace, CLI, manual editor and existing agent must reach the same
actual files and running project. Existing shared authoring/check/render/compose operations
are the reuse boundary. Preserve the existing read-only inspector as a separate contract.

Plan does not write. Approval applies the reviewed content only if its base still matches.
Reject does not write. Auto applies supported changes and reports actual checks. A mode
change cannot silently approve a pending proposal. Distinguish application, checking and
preview readiness; failed checks do not become a successful lesson result.

Do not overwrite concurrent edits, including during reset or undo. Review and resolve a
conflict before applying replacement content. A recoverable failed build retains useful
diagnostics and identifies whether the visible preview is from an older successful build.

The connection flow must distinguish copied setup, exported snapshot, configured agent and
verified connection. Current stdio MCP can read a local project; a browser export is not a
live bridge. A browser demo and a local workspace can share lesson/project content, but
cannot be advertised as one live filesystem until that transport is implemented and proven.

## Checks and saved progress

Bind every successful check to the current project revision and lesson version. Changes to
relevant files invalidate stale results. Run the behavior check after source/build success;
do not complete a lesson merely because Solve, Apply or Next was clicked.

Save the current lesson, relevant source edits and verified progress. On resume, restore the
project before reporting checks as current. Explain storage failure instead of claiming a
successful save. Reset is explicit about the files it replaces and protects later work.

The certificate becomes downloadable only when required core/capstone evidence is current.
It records completion of this Academy curriculum, not a professional accreditation. Keep any
learner name optional and local; no account, upload or mailing workflow is required.

## Proof before delivery

For each implementation increment, independently review full source and run its scoped
proof. Known-bad fixtures must demonstrate that completion, stale approval and conflict
checks can fail. Hosted browser proof covers actual interaction, failure and recovery.
The final Academy needs a full desktop/narrow-layout and keyboard walkthrough, saved-state
restore, certificate gating and all three modes on its delivered source.

Open research limits remain in the linked studies: third-party tutorial failures, native
mobile editing, browser runtime/toolchain compatibility, production licensing and live
external-agent access. Resolve the runtime's material blockers before committing to it.
