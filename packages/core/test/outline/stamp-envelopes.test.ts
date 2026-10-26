// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { MOUNTED_ATTRIBUTE } from "@asmjs/core";
import type { EnvelopeStamps } from "@asmjs/core/outline";
import { stampEnvelopes } from "@asmjs/core/outline";

/** Lets the page tell its observers what has changed. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
let stamps: EnvelopeStamps | undefined;
afterEach(() => stamps?.stop());

describe("noting when the browser puts an envelope on a page and brings it alive", () => {
  it("notes when the runtime marks an envelope mounted, and forgets it when the mark goes", async () => {
    document.body.innerHTML = '<assembly-root data-id="a"></assembly-root>';
    const envelope = document.querySelector("assembly-root") as Element;
    let now = 100;
    stamps = stampEnvelopes(document, () => now);
    expect(stamps.mounted(envelope)).toBeUndefined();
    now = 184;
    envelope.setAttribute(MOUNTED_ATTRIBUTE, "");
    await settle();
    expect(stamps.mounted(envelope)).toBe(184);
    envelope.removeAttribute(MOUNTED_ATTRIBUTE);
    await settle();
    expect(stamps.mounted(envelope)).toBeUndefined();
  });

  it("notes when an answer takes a placeholder's place, with every envelope inside it", async () => {
    document.body.innerHTML = '<assembly-root data-id="a" data-defer=""></assembly-root>';
    const placeholder = document.querySelector("assembly-root") as Element;
    stamps = stampEnvelopes(document, () => 320);
    expect(stamps.arrived(placeholder)).toBeUndefined();
    const answer = document.createElement("assembly-root");
    answer.innerHTML = '<assembly-root data-id="b"></assembly-root>';
    placeholder.replaceWith(answer);
    await settle();
    expect(stamps.arrived(answer)).toBe(320);
    expect(stamps.arrived(answer.firstElementChild as Element)).toBe(320);
  });

  it("is told what happens inside a shadow root only once it watches that root", async () => {
    document.body.innerHTML = "<assembly-root></assembly-root>";
    const host = document.querySelector("assembly-root") as Element;
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<assembly-root data-id="inner"></assembly-root>';
    const inner = root.firstElementChild as Element;
    stamps = stampEnvelopes(document, () => 50);
    stamps.watch(root);
    stamps.watch(root);
    inner.setAttribute(MOUNTED_ATTRIBUTE, "");
    await settle();
    expect(stamps.mounted(inner)).toBe(50);
  });
});
