// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Events } from "@assemblejs/core/client";
import type { AssemblyProps } from "@assemblejs/renderer-lit";
import { LitElement, css, html } from "lit";

// A Lit element: rendered into a declarative shadow root on the server, hydrated in the browser.
class LitCounter extends LitElement {
  static override properties = {
    count: { state: true },
    heard: { state: true },
    events: { attribute: false },
  };
  static override styles = css`
    button {
      color: rgb(120, 0, 120);
    }
  `;
  declare count: number;
  declare heard: string;
  declare events: Events | undefined;
  private stop: (() => void) | undefined;

  constructor() {
    super();
    this.count = 0;
    this.heard = "nothing";
  }

  // The element is defined before hydration hands it the assembly's events, so it subscribes
  // whenever they arrive or change, not when it connects.
  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (!changed.has("events")) return;
    this.stop?.();
    this.stop = this.events?.on("counted", (message) => (this.heard = message.from.name));
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stop?.();
  }

  override render() {
    return html`<button
        type="button"
        id="lit-bump"
        @click=${() => {
          this.count += 1;
          this.events?.send("counted", { count: this.count });
        }}
      >
        lit ${this.count}
      </button>
      <span id="lit-heard">${this.heard}</span>`;
  }
}
if (customElements.get("lit-counter") === undefined)
  customElements.define("lit-counter", LitCounter);

export default (props: AssemblyProps) => html`<lit-counter .events=${props.events}></lit-counter>`;
