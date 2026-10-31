// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorRequest } from "./calculator-request.js";

/** Short authored practice follows actual controller receipts, never clicks or status prose. */
export function createModeWalkthrough(container) {
  const document = container.ownerDocument;
  const panel = document.createElement("section");
  panel.className = "academy-review academy-mode-walkthrough";
  panel.setAttribute("aria-label", "Mode practice");
  const heading = document.createElement("h2");
  const task = document.createElement("p");
  task.setAttribute("role", "status");
  const hint = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Why this step?";
  const explanation = document.createElement("p");
  hint.append(summary, explanation);
  const notice = document.createElement("p");
  const steps = [
    [
      "1. Plan without writing",
      "Select Plan. Ask Add a calculator, then inspect its files.",
      "A plan is a proposal. It does not change your saved project or rebuild the preview.",
    ],
    [
      "2. Reject the proposal",
      "Select Approval and reject this proposal.",
      "Changing mode does not approve a plan. Rejection leaves its proposed files unapplied.",
    ],
    [
      "3. Revise and approve",
      'Use Add a calculator called "Coffee total". Propose, review, then approve.',
      "This is a new proposal. Approval writes only its reviewed source if the base still matches.",
    ],
    [
      "4. Try Auto",
      "Select Auto. Use presets 2, 4, 8, then apply the request.",
      "Auto prepares a fresh supported change, writes it and runs the actual project check.",
    ],
    [
      "You used all three modes",
      "Check & preview, then try the calculator's quantity buttons.",
      "These were real file operations and checks. Preview builds use saved files; quotes come from the shop.",
    ],
  ];
  let step = 0;
  let planned;
  let disposed = false;
  const render = () => {
    [heading.textContent, task.textContent, explanation.textContent] = steps[step];
    hint.open = false;
  };
  panel.append(heading, task, hint, notice);
  container.append(panel);
  render();
  return {
    update(state) {
      const receipt = state.receipt;
      if (disposed || state.busy || step === 4 || !receipt) return;
      let intent;
      try {
        intent = calculatorRequest(receipt.proposal.request);
      } catch {
        return;
      }
      let advance = false;
      if (
        step <= 1 &&
        receipt.kind === "planned" &&
        receipt.mode === "plan" &&
        intent.action === "add"
      ) {
        planned = receipt.proposal;
        const revisedTitle = intent.title === "Coffee total" ? "Order total" : "Coffee total";
        steps[2][1] = `Use Add a calculator called "${revisedTitle}". Propose, review, then approve.`;
        advance = step === 0;
        notice.textContent = "";
        render();
      } else if (
        step === 1 &&
        receipt.kind === "rejected" &&
        receipt.mode === "approval" &&
        receipt.proposal === planned
      ) {
        advance = true;
      } else if (
        step === 2 &&
        receipt.kind === "applied" &&
        receipt.mode === "approval" &&
        intent.action === "add" &&
        intent.title &&
        receipt.proposal !== planned &&
        intent.title !== (calculatorRequest(planned.request).title ?? "Order estimate")
      ) {
        advance = true;
      } else if (
        step === 3 &&
        receipt.kind === "applied" &&
        receipt.mode === "auto" &&
        intent.action === "presets"
      ) {
        advance = true;
      }
      if (advance) {
        step++;
        notice.textContent = "";
        render();
      } else if (step === 1 && receipt.kind === "rejected") {
        notice.textContent =
          "Request a new plan in Plan mode, then switch to Approval to reject that proposal.";
      } else if (receipt.kind === "applied") {
        notice.textContent =
          "Your project changed outside this practice step. Your files are kept; the editing controls remain available.";
      }
    },
    destroy() {
      disposed = true;
      panel.remove();
    },
  };
}
