// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { EnvelopeFacts } from "./envelope-facts.js";
import type { OutlineToolbar } from "./outline-toolbar.js";

const KEY: Readonly<Record<EnvelopeFacts["tone"], string>> = {
  local: "this server",
  remote: "another server",
  cache: "kept answer",
  fallback: "fallback",
  deferred: "deferred",
  inner: "inside another's answer",
};

/**
 * Makes the outline's control: a switch a visitor turns the outline on and off with, and,
 * while it is on, what the page was composed of and what each colour of box means. The colour
 * is never the only word: every box names what answered it as well.
 */
export function createToolbar(page: Document, toggle: () => void): OutlineToolbar {
  const element = page.createElement("div");
  element.className = "bar";
  const summary = page.createElement("span");
  summary.className = "sum";
  const key = page.createElement("ul");
  key.className = "key";
  for (const [tone, words] of Object.entries(KEY)) {
    const entry = page.createElement("li");
    entry.dataset.tone = tone;
    entry.textContent = words;
    key.append(entry);
  }
  const button = page.createElement("button");
  button.type = "button";
  button.className = "switch";
  button.textContent = "Outline";
  button.addEventListener("click", toggle);
  element.append(summary, key, button);
  return {
    element,
    show: (shown, said) => {
      button.setAttribute("aria-pressed", String(shown));
      summary.textContent = said;
      summary.hidden = !shown;
      key.hidden = !shown;
    },
  };
}
