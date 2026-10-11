// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { ENVELOPE_ATTRIBUTE, MOUNTED_ATTRIBUTE, renderEnvelope } from "@assemblejs/core";
import { start } from "@assemblejs/core/client";

// An envelope as the server sends one, with its island, for the runtime to mount.
const sent = (name: string, mount = ""): string =>
  renderEnvelope({
    id: name,
    name,
    view: "default",
    renderer: "html",
    markup: "<p>x</p>",
    data: {},
    ...(mount === "" ? {} : { mount: mount as "none" }),
  });

describe("the attribute that marks an envelope mounted", () => {
  it("is the browser's alone: no server envelope carries it, and it is none of the server's words", () => {
    const html = renderEnvelope({
      id: "a7f3",
      name: "cart",
      view: "default",
      renderer: "html",
      markup: "<p>x</p>",
      data: {},
    });
    expect(html).not.toContain(MOUNTED_ATTRIBUTE);
    expect(Object.values(ENVELOPE_ATTRIBUTE)).not.toContain(MOUNTED_ATTRIBUTE);
  });

  it("is written by the runtime once a renderer has mounted the assembly, and removed on unmount", () => {
    document.body.innerHTML = sent("a") + sent("b", "none");
    const renderer = { mount: () => ({ unmount: () => undefined }) };
    const runtime = start({ renderers: { html: renderer } });
    const marked = () =>
      [...document.querySelectorAll(`[${MOUNTED_ATTRIBUTE}]`)].map((e) =>
        e.getAttribute("data-name"),
      );
    expect(marked()).toEqual(["a"]);
    runtime.unmountAll();
    expect(marked()).toEqual([]);
  });
});
