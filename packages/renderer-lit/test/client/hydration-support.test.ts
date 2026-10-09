// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Lit's support for hydrating server-rendered elements", () => {
  it("is installed, and an element hydrating a server's shadow root adopts its styles", async () => {
    // The browser half first, as a page loads it, so Lit's element base loads after its support.
    const { HYDRATION_SUPPORT } = await import("@assemblejs/renderer-lit/client");
    const { digestForTemplateResult } = await import("@lit-labs/ssr-client");
    const { css, html, LitElement } = await import("lit");
    const card = () => html`<p>card</p>`;
    class StyledCard extends LitElement {
      static override styles = css`
        p {
          color: rgb(1, 2, 3);
        }
      `;
      override render() {
        return card();
      }
    }
    expect(HYDRATION_SUPPORT).toBe(true);
    const element = document.createElement("styled-card");
    // The server's shadow root, with the content the server rendered into it.
    const shadow = element.attachShadow({ mode: "open" });
    shadow.innerHTML = `<!--lit-part ${digestForTemplateResult(card())}--><p>card</p><!--/lit-part-->`;
    const server = shadow.querySelector("p");
    document.body.append(element);
    customElements.define("styled-card", StyledCard);
    await (element as InstanceType<typeof StyledCard>).updateComplete;
    expect(element.shadowRoot).toBe(shadow);
    expect(shadow.querySelector("p")).toBe(server);
    expect(shadow.adoptedStyleSheets.length).toBe(1);
  });

  // Bundled, the browser half's imports all load before any of its own code runs, so one that
  // loaded Lit's element base would register it with the support before this package adapted it.
  it("never loads Lit's element base itself", () => {
    const directory = join(process.cwd(), "src", "client");
    for (const file of readdirSync(directory)) {
      // A type-only import is erased from the build and loads nothing.
      // Lit's template layer (`lit/html.js`) is allowed; `lit`, its element base and its
      // decorators are not, imported, re-exported or loaded bare.
      expect(readFileSync(join(directory, file), "utf8"), file).not.toMatch(
        /^(?:import|export)(?! type )[^;]*?["'](?:lit|lit\/index\.js|lit\/decorators[^"']*|lit-element[^"']*|@lit\/reactive-element[^"']*)["']/m,
      );
    }
  });
});
