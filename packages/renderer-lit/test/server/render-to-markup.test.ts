// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { findPlacements } from "@assemblejs/core";
import { LitElement, css, html } from "lit";
import { describe, expect, it } from "vitest";
import { renderToMarkup } from "@assemblejs/renderer-lit";
import type { AssemblyProps } from "@assemblejs/renderer-lit";
import { BUTTON_MARKUP } from "../fixtures/button-markup.js";
import { buttonView } from "../fixtures/button-view.js";
import { SHELL_MARKUP } from "../fixtures/shell-markup.js";
import { shellView } from "../fixtures/shell-view.js";

// One Lit element rendered by the built package, with the browser half loaded before Lit's
// element base or after it. A view that places a child imports its slot from the browser half,
// so the server loads that half too, and Lit's support for hydration with it.
const RENDER_A_CARD = `
const first = process.argv[1] === "browser-half-first";
if (first) await import("@assemblejs/renderer-lit/client");
const { LitElement, css, html } = await import("lit");
const { renderToMarkup } = await import("@assemblejs/renderer-lit");
if (!first) await import("@assemblejs/renderer-lit/client");
class Card extends LitElement {
  static properties = { name: { type: String }, tone: { type: String, reflect: true } };
  static styles = css\`p { color: red; }\`;
  constructor() { super(); this.tone = "calm"; }
  render() { return html\`<p class=\${this.tone}>hello \${this.name}</p>\`; }
}
customElements.define("probe-card", Card);
const view = (props) => html\`<probe-card name=\${String(props.data.name)}></probe-card>\`;
process.stdout.write(renderToMarkup(view, { data: { name: "Ada" } }));
`;
const renderACard = (order: string): string =>
  execFileSync(process.execPath, ["--input-type=module", "-e", RENDER_A_CARD, order], {
    cwd: fileURLToPath(new URL("../..", import.meta.url)),
    encoding: "utf8",
  });

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
    expect(renderToMarkup(buttonView, { data: { label: "Press" } })).toBe(BUTTON_MARKUP);
  });

  it("renders a slot as the directive, where the composer reads it as that placement", () => {
    expect(renderToMarkup(shellView, { data: {} })).toBe(SHELL_MARKUP);
    expect(findPlacements(SHELL_MARKUP)).toMatchObject([{ name: "inner", view: "default" }]);
  });

  it("renders a Lit element the same whether the browser half loaded before Lit or after", () => {
    const after = renderACard("browser-half-last");
    expect(after).toContain('<p class="calm">hello <!--lit-part-->Ada<!--/lit-part--></p>');
    expect(renderACard("browser-half-first")).toBe(after);
  });

  it("renders a Lit element into a declarative shadow root, so the page is whole without script", () => {
    const view = (props: AssemblyProps) =>
      html`<greeting-card name=${String(props.data["name"])}></greeting-card>`;
    const out = renderToMarkup(view, { data: { name: "Ada" } });
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
    const out = renderToMarkup(view, { data: { text: "<script>alert(1)</script>" } });
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  // A renderer that returned its own error markup would produce something that passes every
  // check downstream, so the page looks fine and is wrong.
  it("throws rather than returning error markup", () => {
    const broken = (): never => {
      throw new Error("this view is broken");
    };
    expect(() => renderToMarkup(broken, { data: {} })).toThrow("this view is broken");
  });

  it("hands the view the server's events, as it hydrates with the page's", () => {
    const view = (props: AssemblyProps) =>
      html`<p>${props.events.last("counted") === undefined ? "nothing yet" : "heard"}</p>`;
    expect(renderToMarkup(view, { data: {} })).toContain("nothing yet");
  });
});
