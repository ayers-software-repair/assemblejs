// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { LitElement, css, html } from "lit";
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-lit";
import type { AssemblyProps } from "@assemblejs/renderer-lit";
import { BUTTON_MARKUP } from "../fixtures/button-markup.js";
import { buttonView } from "../fixtures/button-view.js";

class GreetingCard extends LitElement {
  static override properties = { name: { type: String } };
  static override styles = css`
    p {
      color: red;
    }
  `;
  declare name: string;
  override render() {
    return html`<p>hello ${this.name}</p>`;
  }
}
customElements.define("greeting-card", GreetingCard);

describe("rendering a Lit view on the server", () => {
  it("renders exactly the markup the browser half is tested hydrating", () => {
    expect(renderToMarkup(buttonView, { data: { label: "Press" }, children: {} })).toBe(
      BUTTON_MARKUP,
    );
  });

  it("renders a Lit element into a declarative shadow root, so the page is whole without script", () => {
    const view = (props: AssemblyProps) =>
      html`<greeting-card name=${String(props.data["name"])}></greeting-card>`;
    const out = renderToMarkup(view, { data: { name: "Ada" }, children: {} });
    expect(out).toMatch(
      /<greeting-card\s+name="Ada"[^>]*><template shadowroot="open" shadowrootmode="open">/,
    );
    expect(out).toContain("hello <!--lit-part-->Ada<!--/lit-part-->");
    // Its styles are adopted when it hydrates; an inline <style> the page's policy refuses is not
    // sent.
    expect(out).not.toContain("<style>");
  });

  it("escapes what it renders, because Lit does", () => {
    const view = (props: AssemblyProps) => html`<p>${String(props.data["text"])}</p>`;
    const out = renderToMarkup(view, { data: { text: "<script>alert(1)</script>" }, children: {} });
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  // A renderer that returned its own error markup would produce something that passes every
  // check downstream, so the page looks fine and is wrong.
  it("throws rather than returning error markup", () => {
    const broken = (): never => {
      throw new Error("this view is broken");
    };
    expect(() => renderToMarkup(broken, { data: {}, children: {} })).toThrow("this view is broken");
  });

  it("hands the view the server's events, as it hydrates with the page's", () => {
    const view = (props: AssemblyProps) =>
      html`<p>${props.events.last("counted") === undefined ? "nothing yet" : "heard"}</p>`;
    expect(renderToMarkup(view, { data: {}, children: {} })).toContain("nothing yet");
  });
});
