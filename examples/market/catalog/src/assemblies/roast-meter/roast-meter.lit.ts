// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@asmjs/renderer-lit";
import { LitElement, css, html, nothing } from "lit";

// A scale with one step lit: a Lit element, rendered into its own shadow root on the server
// and hydrated there. Its styles are its own, and the colours they read are the page's tokens,
// which a shadow root inherits.
class RoastMeter extends LitElement {
  static override properties = { steps: { attribute: false }, at: { type: Number } };
  static override styles = css`
    ol {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--border);
      border-radius: var(--corner);
      color: var(--ink-muted);
      font-size: var(--text-1);
      text-align: center;
      text-transform: capitalize;
    }
    li[aria-current="true"] {
      border-color: var(--accent);
      background: var(--accent);
      color: var(--surface);
      font-weight: 600;
    }
  `;
  declare steps: string[];
  declare at: number;

  constructor() {
    super();
    this.steps = [];
    this.at = -1;
  }

  override render() {
    return html`<ol aria-label="Roast">
      ${this.steps.map(
        (step, index) =>
          html`<li aria-current=${index === this.at ? "true" : nothing}>${step}</li>`,
      )}
    </ol>`;
  }
}
customElements.define("roast-meter", RoastMeter);

export default ({ data }: AssemblyProps<{ steps: string[]; at: number }>) =>
  data.at < 0 ? html`` : html`<roast-meter .steps=${data.steps} .at=${data.at}></roast-meter>`;
