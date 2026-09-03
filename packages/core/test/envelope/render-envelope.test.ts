// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { renderEnvelope } from "@assemblejs/core";
import type { EnvelopeInput } from "@assemblejs/core";

const input = (over: Partial<EnvelopeInput> = {}): EnvelopeInput => ({
  id: "a7f3",
  name: "cart",
  view: "default",
  renderer: "svelte",
  markup: "<p>cart</p>",
  data: { total: 2 },
  ...over,
});

describe("rendering the envelope", () => {
  it("emits the canonical attribute set and the island", () => {
    const html = renderEnvelope(input());
    expect(html).toBe(
      `<assembly-root data-name="cart" data-id="a7f3" data-view="default" data-renderer="svelte">` +
        `<p>cart</p>` +
        `<script type="application/json" data-assembly="a7f3">` +
        `{"id":"a7f3","name":"cart","view":"default","renderer":"svelte","data":{"total":2},"deferred":false}` +
        `</script></assembly-root>`,
    );
  });

  it("adds the optional attributes only when they apply", () => {
    expect(renderEnvelope(input())).not.toContain("data-remote");
    expect(renderEnvelope(input())).not.toContain("data-defer");
    expect(renderEnvelope(input())).not.toContain("data-failed");

    const marked = renderEnvelope(
      input({ remote: "https://checkout.example.com", deferred: true, failed: true }),
    );
    expect(marked).toContain(`data-remote="https://checkout.example.com"`);
    expect(marked).toContain(`data-defer=""`);
    expect(marked).toContain(`data-failed=""`);
  });

  // The named adversarial case: no value can end the tag it sits in, whatever it contains.
  //
  // The property under test is not that the text "onload=" is absent. It survives, as inert
  // characters inside an entity-escaped attribute value, and that is correct. The injection
  // works only if a RAW quote closes the attribute first, so that is what is asserted.
  it("cannot have its opening tag ended by any attribute value", () => {
    const html = renderEnvelope(
      input({ name: `cart" onload="alert(1)`, view: `x"><script>alert(2)</script>` }),
    );
    expect(html.match(/<assembly-root/g)).toHaveLength(1);
    expect(html).not.toContain(`onload="`);
    expect(html).toContain("onload=&quot;");
    // The only script element on the page is the island this function wrote.
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).not.toContain("<script>alert");

    // Nothing raw survives in the opening tag: every attribute value is entity-escaped, so the
    // tag has exactly the quotes this function put there, two per attribute.
    const openingTag = html.slice(0, html.indexOf(">") + 1);
    expect((openingTag.match(/"/g) ?? []).length).toBe(8);
  });

  it("cannot have its island closed by the data it carries", () => {
    const html = renderEnvelope(input({ data: { evil: `</script><img onerror=alert(1)>` } }));
    // Again the property is structural, not textual: "onerror" survives as characters inside a
    // JSON string in a non-executable element, which is harmless. What must not survive is a
    // "<" that could start a tag or close this one.
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html.match(/<script/g)).toHaveLength(1);
    const island = html.slice(html.indexOf(">{") + 1, html.indexOf("</script>"));
    expect(island).not.toContain("<");
    expect(island).toContain("\\u003c");
    expect(JSON.parse(island).data.evil).toBe(`</script><img onerror=alert(1)>`);
  });

  it("inserts the assembly's own markup verbatim, because it is html by contract", () => {
    const html = renderEnvelope(input({ markup: `<button class="buy">Buy</button>` }));
    expect(html).toContain(`<button class="buy">Buy</button>`);
  });

  it("never carries a field the projection did not name", () => {
    const html = renderEnvelope(input());
    expect(html).not.toContain("markup");
    expect(html).not.toContain("remote");
  });
});
