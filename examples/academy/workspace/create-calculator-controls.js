// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { CalculatorModes } from "./calculator-modes.js";

/** Authored guidance and exact source review over the same tools as manual/agent changes. */
export function createCalculatorControls(container, client, recipe) {
  const document = container.ownerDocument;
  const node = (tag, text) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const panel = node("section");
  panel.className = "academy-review academy-calculator";
  panel.setAttribute("aria-label", "Guided calculator");
  panel.append(
    node("h2", "Guided calculator"),
    node(
      "p",
      "Authored guidance. Choose a supported request, review its files, and run it in your selected mode.",
    ),
  );
  const modeLabel = node("label", "Agent mode");
  const mode = node("select");
  mode.setAttribute("aria-label", "Agent mode");
  for (const [value, label] of [
    ["plan", "Plan"],
    ["approval", "Approval"],
    ["auto", "Auto"],
  ]) {
    const option = node("option", label);
    option.value = value;
    mode.append(option);
  }
  modeLabel.append(mode);
  const requestLabel = node("label", "Request");
  const input = node("input");
  input.setAttribute("aria-label", "Calculator request");
  input.maxLength = 200;
  input.value = "Add a calculator";
  requestLabel.append(input);
  const examples = node("div");
  examples.setAttribute("aria-label", "Supported requests");
  const exampleButtons = [];
  for (const text of [
    "Add a calculator",
    'Add a calculator called "Coffee total"',
    'Rename calculator to "Order total"',
    "Use presets 2, 4, 8",
  ]) {
    const button = node("button", text);
    button.type = "button";
    button.addEventListener("click", () => {
      input.value = text;
      input.focus();
    });
    examples.append(button);
    exampleButtons.push(button);
  }
  const request = node("button", "Plan changes");
  const approve = node("button", "Approve changes");
  const reject = node("button", "Reject proposal");
  for (const button of [request, approve, reject]) button.type = "button";
  const status = node("p");
  status.setAttribute("role", "status");
  const review = node("div");
  review.setAttribute("aria-label", "Reviewed calculator changes");
  const diagnostics = node("details");
  const output = node("pre");
  diagnostics.append(node("summary", "Project diagnostics"), output);
  let disposed = false;
  const modes = new CalculatorModes(client, recipe, (state) => {
    if (disposed) return;
    mode.value = state.mode;
    mode.disabled = input.disabled = state.busy;
    request.disabled = state.busy;
    request.textContent = {
      plan: "Plan changes",
      approval: "Propose changes",
      auto: "Apply request and check",
    }[state.mode];
    approve.disabled = state.busy || state.mode !== "approval" || !state.pending;
    reject.disabled = state.busy || !state.pending;
    for (const button of exampleButtons) button.disabled = state.busy;
    status.textContent = state.phase;
    output.textContent = JSON.stringify({ result: state.result, check: state.check }, null, 2);
    review.replaceChildren();
    if (state.pending) {
      review.append(
        node("h3", `Review: ${state.pending.request}`),
        node("p", state.pending.explanation),
      );
      for (const change of state.pending.changes) {
        review.append(node("h4", change.path));
        if (change.before !== null) {
          const before = node("pre");
          before.append(node("del", change.before));
          review.append(node("p", "Before"), before);
        } else review.append(node("p", "New file"));
        const after = node("pre");
        after.append(node("ins", change.after));
        review.append(node("p", "After"), after);
      }
    }
  });
  mode.addEventListener("change", () => modes.mode(mode.value));
  request.addEventListener("click", () => void modes.request(input.value));
  approve.addEventListener("click", () => void modes.approve());
  reject.addEventListener("click", () => void modes.reject());
  panel.append(
    modeLabel,
    requestLabel,
    examples,
    request,
    approve,
    reject,
    status,
    review,
    diagnostics,
  );
  container.append(panel);
  modes.changed(modes.state);
  return {
    modes,
    destroy() {
      disposed = true;
      panel.remove();
    },
  };
}
