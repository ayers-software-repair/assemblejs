// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import type { AssemblyProps } from "@asmjs/renderer-lit";
import { LitElement, css, html } from "lit";

// Five marks, as many filled as the product was given, and the number beside them. A Lit
// element in a shadow root of its own: the marks are drawn with the page's tokens and nothing
// the page styles reaches inside.
class StarRating extends LitElement {
  static override properties = { mean: { type: Number }, count: { type: Number } };
  static override styles = css`
    :host {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }
    ol {
      display: flex;
      gap: 2px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      inline-size: 1rem;
      block-size: 1rem;
      border: 2px solid var(--accent);
      border-radius: 50%;
      box-sizing: border-box;
    }
    li.full {
      background: var(--accent);
    }
    span {
      color: var(--ink-muted);
      font-size: var(--text-1);
    }
  `;
  declare mean: number;
  declare count: number;

  constructor() {
    super();
    this.mean = 0;
    this.count = 0;
  }

  override render() {
    const full = Math.round(this.mean);
    return html`<ol role="img" aria-label=${`Rated ${this.mean} out of 5`}>
        ${[1, 2, 3, 4, 5].map((mark) => html`<li class=${mark <= full ? "full" : ""}></li>`)}
      </ol>
      <span>${this.mean} from ${this.count} ${this.count === 1 ? "review" : "reviews"}</span>`;
  }
}
customElements.define("star-rating", StarRating);

export default ({ data }: AssemblyProps<{ count: number; mean: number }>) =>
  data.count === 0
    ? html`<p>No reviews yet.</p>`
    : html`<star-rating .mean=${data.mean} .count=${data.count}></star-rating>`;
