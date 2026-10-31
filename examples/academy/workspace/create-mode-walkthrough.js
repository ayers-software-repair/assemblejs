// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { calculatorPresets } from "./calculator-presets.js";
import { calculatorTitle } from "./calculator-title.js";
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
  task.setAttribute("aria-label", "Practice task");
  const hint = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Guided tutor";
  const explanation = document.createElement("p");
  const authored = document.createElement("p");
  authored.textContent = "Authored guidance, no AI inference. Try Next, Why, Files or Customize.";
  const form = document.createElement("form");
  const label = document.createElement("label");
  label.textContent = "Ask guided tutor";
  const question = document.createElement("input");
  question.setAttribute("aria-label", "Ask guided tutor");
  question.maxLength = 200;
  label.append(question);
  const send = document.createElement("button");
  send.type = "submit";
  send.textContent = "Ask tutor";
  const answer = document.createElement("p");
  answer.setAttribute("role", "status");
  answer.setAttribute("aria-label", "Tutor answer");
  form.append(label, send, answer);
  hint.append(summary, authored, explanation, form);
  const notice = document.createElement("p");
  const steps = [
    [
      "1. Plan without writing",
      "Select Plan. Add a calculator or plan a new title, then inspect its files.",
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
      "Check & preview, verify the calculator, then try its quantity buttons.",
      "These were real file operations and checks. Preview builds use saved files; quotes come from the shop.",
    ],
  ];
  let step = 0;
  let planned;
  let disposed = false;
  let pendingProposal;
  let working = false;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (disposed) return;
    const text = question.value
      .trim()
      .toLowerCase()
      .replace(/[?.!]+$/, "");
    if (question.value.length > 200) answer.textContent = "Keep questions to 200 characters.";
    else if (working)
      answer.textContent = "Wait for the current operation; inspect its actual diagnostics.";
    else if (["next", "help", "hint", "what should i do"].includes(text))
      answer.textContent = steps[step][1];
    else if (["why", "why this step"].includes(text)) answer.textContent = steps[step][2];
    else if (["files", "which files", "show files"].includes(text))
      answer.textContent = pendingProposal
        ? `Files in the pending proposal (bases are checked when applying): ${pendingProposal.changes.map((change) => change.path).join(", ")}`
        : "No pending proposal. Plan a supported change to inspect its actual files.";
    else if (["customize", "what can i customize"].includes(text))
      answer.textContent =
        'Use Rename calculator to "Your title" or Use presets 1, 3, 6 in the Request field. Titles: up to 60 characters. Presets: one to six unique integers, 1–99. Other executable edits need manual work or your own agent.';
    else
      answer.textContent =
        "I have authored answers for Next, Why, Files and Customize. I cannot diagnose an unknown question or make changes here. Keep actual tool diagnostics visible; use your own agent for broader help.";
  });
  const render = () => {
    [heading.textContent, task.textContent, explanation.textContent] = steps[step];
    hint.open = false;
  };
  panel.append(heading, task, hint, notice);
  container.append(panel);
  render();
  return {
    update(state) {
      if (disposed) return;
      working = state.busy;
      pendingProposal = state.busy ? undefined : state.pending;
      answer.textContent = "";
      const receipt = state.receipt;
      if (state.busy || step === 4 || !receipt) return;
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
        ["add", "title"].includes(intent.action)
      ) {
        let revisedTitle;
        try {
          const before = receipt.proposal.changes.find(
            (change) =>
              change.path === "src/assemblies/price-calculator/price-calculator.react.tsx",
          )?.before;
          revisedTitle = ["Coffee total", "Order total", "Quick estimate"].find(
            (title) =>
              title !== (intent.title ?? "Order estimate") &&
              (intent.action === "add" ||
                (typeof before === "string" && calculatorTitle(before, title) !== before)),
          );
        } catch (error) {
          notice.textContent = `Practice needs source inspection: ${String(error)}. Your files are kept.`;
          return;
        }
        if (!revisedTitle) return;
        planned = receipt.proposal;
        const action = intent.action === "add" ? "Add a calculator called" : "Rename calculator to";
        steps[2][1] = `${action} "${revisedTitle}". Propose, review, then approve.`;
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
        intent.action === calculatorRequest(planned.request).action &&
        intent.title &&
        receipt.proposal !== planned &&
        intent.title !== (calculatorRequest(planned.request).title ?? "Order estimate")
      ) {
        try {
          const after = receipt.proposal.changes.find(
            (change) =>
              change.path === "src/assemblies/price-calculator/price-calculator.react.tsx",
          )?.after;
          const { values } = calculatorPresets(after);
          const next =
            values.length === 3 && values.every((value, index) => value === [2, 4, 8][index])
              ? [1, 3, 6]
              : [2, 4, 8];
          steps[3][1] = `Select Auto. Use presets ${next.join(", ")}, then apply the request.`;
        } catch (error) {
          notice.textContent = `Practice needs source inspection: ${String(error)}. Your files are kept.`;
          return;
        }
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
