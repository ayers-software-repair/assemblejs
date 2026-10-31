// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { AssemblyModes } from "./assembly-modes.js";

/** Authored explanations and real proposal contents, with no inferred agent reasoning. */
export function createAssemblyControls(container, client) {
  const document = container.ownerDocument;
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const label = (text, input) => {
    const node = element("label", text);
    node.append(input);
    return node;
  };
  const panel = element("section");
  panel.className = "academy-review";
  panel.setAttribute("aria-label", "Assembly authoring modes");
  const mode = element("select");
  mode.setAttribute("aria-label", "Agent mode");
  for (const [value, label] of [
    ["plan", "Plan"],
    ["approval", "Approval"],
    ["auto", "Auto"],
  ]) {
    const option = element("option", label);
    option.value = value;
    mode.append(option);
  }
  const instruction = element("p");
  const name = element("input");
  name.setAttribute("aria-label", "Assembly name");
  name.value = "quantity-note";
  const renderer = element("select");
  renderer.setAttribute("aria-label", "Assembly renderer");
  for (const value of [
    "html",
    "react",
    "preact",
    "vue",
    "svelte",
    "solid",
    "lit",
    "ejs",
    "markdown",
    "nunjucks",
    "handlebars",
    "pug",
  ])
    renderer.append(element("option", value));
  const propose = element("button", "Plan assembly");
  const approve = element("button", "Approve changes");
  const reject = element("button", "Reject proposal");
  for (const button of [propose, approve, reject]) button.type = "button";
  const status = element("p");
  status.setAttribute("role", "status");
  const diff = element("div");
  diff.setAttribute("aria-label", "Proposed file changes");
  const result = element("pre");
  result.setAttribute("aria-label", "Actual tool results");
  let disposed = false;
  const controls = new AssemblyModes(client, (state) => {
    if (disposed) return;
    mode.value = state.mode;
    instruction.textContent = {
      plan: "Plan shows exact files. It writes nothing. Switch to Approval to review and apply.",
      approval:
        "Review the files, then approve or reject. A mode change never approves a proposal.",
      auto: "Your next request applies a new proposal and runs the real check. Existing proposals stay unapplied.",
    }[state.mode];
    for (const input of [mode, name, renderer, propose]) input.disabled = state.busy;
    propose.textContent = {
      plan: "Plan assembly",
      approval: "Propose changes",
      auto: "Add assembly and check",
    }[state.mode];
    approve.disabled = state.busy || state.mode !== "approval" || !state.pending;
    reject.disabled = state.busy || !state.pending;
    status.textContent = state.phase;
    diff.replaceChildren();
    for (const change of state.pending?.changes ?? []) {
      const details = element("details");
      details.open = true;
      details.append(element("summary", `Add ${change.path}`));
      const code = element("pre");
      code.append(element("ins", change.after));
      details.append(element("p", "New file; no previous content."), code);
      diff.append(details);
    }
    result.textContent = JSON.stringify({ result: state.result, check: state.check }, null, 2);
  });
  mode.addEventListener("change", () => controls.mode(mode.value));
  propose.addEventListener("click", () => void controls.propose(name.value, renderer.value));
  approve.addEventListener("click", () => void controls.approve());
  reject.addEventListener("click", () => void controls.reject());
  panel.append(
    element("h2", "Try the three modes"),
    element(
      "p",
      "Guided controls use authored explanations and shared project tools. No model inference is running.",
    ),
    label("Agent mode", mode),
    instruction,
    label("Assembly name", name),
    label("Assembly renderer", renderer),
    propose,
    approve,
    reject,
    status,
    diff,
    result,
  );
  container.append(panel);
  controls.mode("plan");
  return {
    controls,
    destroy() {
      disposed = true;
      panel.remove();
    },
  };
}
