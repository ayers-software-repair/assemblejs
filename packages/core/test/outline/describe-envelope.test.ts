// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { OutlinePlacement } from "@assemblejs/core/outline";
import { describeEnvelope } from "@assemblejs/core/outline";

/** The first envelope of some markup, on a page of its own. */
const envelope = (markup: string, pick = "assembly-root"): Element => {
  document.body.innerHTML = markup;
  return document.querySelector(pick) as Element;
};
const cart =
  '<assembly-root data-name="cart" data-id="a" data-view="default" data-renderer="react"';
const row = (source: OutlinePlacement["source"], more: Partial<OutlinePlacement> = {}) => ({
  id: "a",
  name: "cart",
  view: "default",
  source,
  ms: 3.2,
  ...more,
});
const said = (facts: ReturnType<typeof describeEnvelope>, label: string): string | undefined =>
  facts.rows.find(([name]) => name === label)?.[1];

describe("what an outline says of one envelope", () => {
  it("says an assembly this server rendered, how long it took and what it waits for", () => {
    const facts = describeEnvelope(envelope(`${cart} data-mount="visible"></assembly-root>`), {
      ...row("local"),
      browser: true,
    });
    expect(facts).toMatchObject({ name: "cart", tone: "local", brief: "3.2 ms" });
    expect(said(facts, "From")).toBe("this server");
    expect(said(facts, "Answered")).toBe("rendered by the server in 3.2 ms");
    expect(said(facts, "Renderer")).toBe("react");
    expect(said(facts, "In the browser")).toBe("waiting to mount, when it scrolls into view");
  });

  it("says when the browser brought it alive, and names a view that is not the default", () => {
    const facts = describeEnvelope(
      envelope(cart.replace('"default"', '"compact"') + ' data-mounted=""></assembly-root>'),
      row("local", { browser: true }),
      { mounted: 184 },
    );
    expect(facts.name).toBe("cart:compact");
    expect(facts.brief).toBe("3.2 ms, live");
    expect(said(facts, "In the browser")).toBe("mounted and live 184 ms after the page began");
  });

  it("says a static assembly sends no JavaScript, and one declared never to mount", () => {
    const still = describeEnvelope(
      envelope(`${cart}></assembly-root>`),
      row("local", { browser: false }),
    );
    expect(said(still, "In the browser")).toBe("static HTML: it sends no JavaScript");
    const never = describeEnvelope(
      envelope(`${cart} data-mount="none"></assembly-root>`),
      row("local"),
    );
    expect(said(never, "In the browser")).toBe("static: declared never to mount");
  });

  it("says another server's by its origin, a kept answer, and a fallback by its log line", () => {
    const remote = describeEnvelope(
      envelope(`${cart} data-remote="https://checkout.example.com"></assembly-root>`),
      row("remote", { ms: 42 }),
    );
    expect(remote).toMatchObject({ tone: "remote", brief: "42 ms" });
    expect(said(remote, "From")).toBe("https://checkout.example.com");
    expect(said(remote, "Answered")).toBe("fetched by the server in 42 ms");
    const kept = describeEnvelope(envelope(`${cart}></assembly-root>`), row("cache", { ms: 0.04 }));
    expect(kept).toMatchObject({ tone: "cache", brief: "kept" });
    const failed = describeEnvelope(
      envelope(`${cart} data-failed="c30ba27b"><p>unavailable</p></assembly-root>`),
      row("fallback", { refused: 3 }),
    );
    expect(failed).toMatchObject({ tone: "fallback", brief: "fallback" });
    expect(said(failed, "Answered")).toBe(
      "a fallback; the failure is logged as c30ba27b, one of 3 the request refused past its limit",
    );
    expect(said(failed, "In the browser")).toBeUndefined();
  });

  it("says a deferred placement before the browser fills it, and after", () => {
    const waiting = describeEnvelope(
      envelope(`${cart} data-defer=""></assembly-root>`),
      row("deferred"),
    );
    expect(waiting).toMatchObject({ tone: "deferred", brief: "deferred" });
    expect(said(waiting, "In the browser")).toBeUndefined();
    const filled = describeEnvelope(envelope(`${cart}></assembly-root>`), row("deferred"), {
      arrived: 320,
    });
    expect(filled.brief).toBe("deferred, 320 ms");
    expect(said(filled, "Answered")).toBe(
      "asked for by the browser, and here 320 ms after the page began",
    );
  });

  it("says an envelope with no account by what holds it, across a shadow root", () => {
    const inner = describeEnvelope(
      envelope(
        '<assembly-root data-name="shell" data-remote="https://b.example"><assembly-root class="in" data-name="nav"></assembly-root></assembly-root>',
        ".in",
      ),
      undefined,
    );
    expect(inner).toMatchObject({ name: "nav", tone: "remote", brief: "in shell" });
    expect(said(inner, "From")).toBe("https://b.example");
    expect(said(inner, "Answered")).toBe("arrived inside the answer for shell");
    expect(said(inner, "In the browser")).toBeUndefined();

    const host = envelope('<assembly-root data-name="walled"></assembly-root>');
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = '<assembly-root data-name="badge"></assembly-root>';
    expect(describeEnvelope(root.firstElementChild as Element, undefined)).toMatchObject({
      tone: "inner",
      brief: "in walled",
    });
    expect(describeEnvelope(host, undefined)).toMatchObject({ tone: "inner", brief: "no account" });
  });
});
