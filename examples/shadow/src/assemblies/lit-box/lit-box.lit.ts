// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@assemblejs/renderer-lit";
import { html } from "lit";

export const shadow = true;

// A template whose button counts by re-rendering the view in place, through its own binding.
export default (props: AssemblyProps) => {
  void props;
  return html`<button
    type="button"
    class="bump"
    id="lit-bump"
    @click=${(event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const count = Number(button.dataset["count"] ?? "0") + 1;
      button.dataset["count"] = String(count);
      button.textContent = `lit ${String(count)}`;
    }}
  >
    lit 0
  </button>`;
};
