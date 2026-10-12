// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { LitElement, html } from "lit";
import type { AssemblyProps } from "@assemblejs/renderer-lit";

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

/**
 * A view that hands an element its list as a property. Both test projects build it: the server
 * one renders it, the browser one hydrates it.
 */
export const stepsView = (props: AssemblyProps) =>
  html`<probe-steps .steps=${props.data["steps"] as string[]}></probe-steps>`;
