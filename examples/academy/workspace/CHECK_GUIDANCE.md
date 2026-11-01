# Explain an actual project check

In the existing Guided tutor, ask **Check and explain** (or **Explain check**). The same connected
MCP client reads the saved-source version, runs check and explains the first actual finding's
rule. The answer includes the observed revision, finding count, file, diagnostic, fix and the
existing catalogue's authored reason. Long fields show an ellipsis; this summarizes the first
finding, not every diagnostic. There is no model inference or automatic repair.

Next/Why/Files/Customize keep their existing no-extra-tool-call behavior. The new question calls
only read_source_version, check and explain; a passing check does not call explain. It does not
write source, rebuild or start a preview, approve a proposal or advance practice. Source and
existing diagnostic panes are kept. A successful check explicitly does not verify preview,
hydration, lesson completion, saved progress or a certificate.

Both source-version observations must agree. This is the existing observation contract, not
an atomic snapshot or edit-and-revert guarantee. Malformed check envelopes fail closed; unknown,
failed or mismatched rule explanations retain the actual finding/fix with an honest limitation.
Raw transport/error bytes are never shown as guidance. Input remains limited to200 characters;
only the first finding is summarized, each displayed field at most240 characters. Replies are
bounded by the existing one-megabyte MCP envelope and a1000-finding sanity limit.

A newer question or controller update invalidates the answer. Disposal ignores late responses.
A30-second UI deadline releases pending question state; a still-running read may finish later
but cannot replace a newer answer or chain additional reads after invalidation. The tutor uses
the same raw connected client, outside the workspace's mutation/preview pending counter, so a
hung read cannot retain the preview lock. Existing authoring and build guards are unchanged.
This does not introduce a transport, account, model, runtime selection or standalone Studio.

Source proof:21 focused guidance cases, one composed timeout regression, and unchanged original
practice/workspace tests pass. Disabled source-version, rule-identity and late-answer guards
were each observed failing before exact restoration. Independent review found the shared
pending-lock defect; its composed regression failed before the raw read-only wiring correction.
All150 selected source/DOM/filesystem/mock cases now pass, with focused lint/noEmit green.
The existing hosted real-MCP workspace proof is extended with a missing-alt finding, actual
rule explanation, manual repair, keyboard/narrow captures and no-write/no-build assertions.
At source `564f4d9`, all ten normal jobs pass: CI `41349046327`, modes `41349046238`
(121 focused/thirteen browser cases) and editor `41349046196`. Personal review `5730246112`
and artifact QA `6563795013` accept the source and captured slice. Artifact `13100323502`
is3,150,728 bytes, SHA-256
`542f3dde299703b39add2e7ec1196bff57e545dacba11e9a91514c3e188b5127`.
Its actual missing-alt finding, matched explanation and manual repair use different observed
revisions; all eight calls are reads, builds/active/errors/HTTP failures are empty and practice
stays at step1. Three new captures and seven changed prior images pass; nineteen prior images
are byte-identical. Final record-head checks/review, actual merge and post-merge remain required.
