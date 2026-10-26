// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { LitElement, html } from "lit";
import type { AssemblyProps } from "@asmjs/renderer-lit";

/** An element whose list is a property: what it renders is nothing until it is given one. */
export class ProbeSteps extends LitElement {
  static override properties = { steps: { attribute: false } };
  declare steps: string[];

  constructor() {
    super();
    this.steps = [];
  }

  override render() {
    return html`<ol>
      ${this.steps.map((step) => html`<li>${step}</li>`)}
    </ol>`;
  }
}
customElements.define("probe-steps", ProbeSteps);

/** An element the view gives nothing: its state is its own. */
export class ProbeCount extends LitElement {
  static override properties = { count: { state: true } };
  declare count: number;

  constructor() {
    super();
    this.count = 0;
  }

  override render() {
    return html`<button type="button" @click=${() => (this.count += 1)}>${this.count}</button>`;
  }
}
customElements.define("probe-count", ProbeCount);

/**
 * A view that hands one element its list as a property and another nothing at all. Both test
 * projects build it: the server one renders it, the browser one hydrates it.
 */
export const stepsView = (props: AssemblyProps) =>
  html`<probe-steps .steps=${props.data["steps"] as string[]}></probe-steps
    ><probe-count></probe-count>`;
