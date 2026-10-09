// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { css, html, LitElement } from "lit";
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-lit";

class Quoted extends LitElement {
  static override styles = css`
    p::before {
      content: "<";
    }
    /* a < b */
  `;
  override render() {
    return html`<p>quoted</p>`;
  }
}
class Closed extends LitElement {
  static override shadowRootOptions = { ...LitElement.shadowRootOptions, mode: "closed" as const };
  static override styles = css`
    p {
      color: red;
    }
  `;
  override render() {
    return html`<p>closed</p>`;
  }
}
customElements.define("quoted-card", Quoted);
customElements.define("closed-card", Closed);

describe("rendering a Lit element's shadow root without its inline style", () => {
  it("leaves every element's styles out, whatever they contain and however the root is declared", () => {
    const out = renderToMarkup(
      () => html`<quoted-card></quoted-card><closed-card></closed-card><quoted-card></quoted-card>`,
      { data: {}, children: {} },
    );
    expect(out).not.toContain("<style>");
    expect(out).not.toContain("</style>");
    expect(out.match(/<p>quoted<\/p>/g)).toHaveLength(2);
    expect(out).toContain("<p>closed</p>");
  });

  it("leaves a template the view wrote itself as written", () => {
    const out = renderToMarkup(
      () =>
        html`<div>
          <template shadowrootmode="open"
            ><style>
              p {
              }
            </style>
            <p>own</p></template
          >
        </div>`,
      { data: {}, children: {} },
    );
    expect(out).toMatch(/<style>\s*p\s*\{\s*\}\s*<\/style>/);
  });
});
