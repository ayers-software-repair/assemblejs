// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { Events } from "@assemblejs/core/client";
import type { AssemblyProps } from "@assemblejs/renderer-lit";
import { LitElement, css, html } from "lit";
import { basket } from "../../browser/basket.js";

// The link to the basket, with how many things are in it. The count is the browser's to know:
// the server renders the link, and the element fills the number in once it is live and keeps
// it right as other assemblies say "basket:changed" on the page's bus.
class BasketCount extends LitElement {
  static override properties = { count: { state: true }, events: { attribute: false } };
  static override styles = css`
    a {
      display: inline-flex;
      gap: var(--space-2);
      align-items: center;
      color: var(--ink);
      font-weight: 600;
      text-decoration: none;
    }
    span {
      min-inline-size: 1.6em;
      padding: 0 var(--space-1);
      border-radius: 1em;
      background: var(--accent);
      color: var(--surface);
      font-size: var(--text-1);
      text-align: center;
    }
  `;
  declare count: number;
  declare events: Events | undefined;
  private stop: (() => void) | undefined;

  constructor() {
    super();
    this.count = 0;
  }

  // Once it has hydrated, and not before: the element hydrates the markup the server sent,
  // which says nought, and a count set earlier would be taken for what is already drawn.
  override firstUpdated(): void {
    this.count = basket.count(basket.read());
  }

  // The events arrive after the element is defined, so it listens whenever they are given.
  override willUpdate(changed: Map<PropertyKey, unknown>): void {
    if (!changed.has("events")) return;
    this.stop?.();
    this.stop = this.events?.on<{ count: number }>("basket:changed", (said) => {
      this.count = said.payload.count;
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stop?.();
  }

  override render() {
    return html`<a href="/basket" aria-label=${`Basket, ${this.count} in it`}
      >Basket <span>${this.count}</span></a
    >`;
  }
}
customElements.define("basket-count", BasketCount);

export default ({ events }: AssemblyProps) => html`<basket-count .events=${events}></basket-count>`;
