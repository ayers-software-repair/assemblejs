// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { slot } from "@assemblejs/renderer-lit/client";
import { LitElement, html } from "lit";

// The shell's own state lives in an element, as a Lit view's state does.
class LitShellCount extends LitElement {
  static override properties = { count: { state: true } };
  declare count: number;

  constructor() {
    super();
    this.count = 0;
  }

  override render() {
    return html`<button type="button" id="lit-shell-bump" @click=${() => (this.count += 1)}>
      lit shell ${this.count}
    </button>`;
  }
}
if (customElements.get("lit-shell-count") === undefined)
  customElements.define("lit-shell-count", LitShellCount);

// A Lit view that places a React assembly. The child of a Lit view may be written in anything
// but Lit, unless that child renders in a shadow root of its own.
export default () =>
  html`<section><lit-shell-count></lit-shell-count>${slot("react-counter")}</section>`;
