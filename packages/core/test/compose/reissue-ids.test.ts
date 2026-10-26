// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { reissueIds, renderEnvelope } from "@asmjs/core";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const MINE = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const envelope = (name: string, id: string, markup: string): string =>
  renderEnvelope({ id, name, view: "default", renderer: "html", markup, data: { n: 1 } });
/** Ids minted in order, so what each envelope was given can be said. */
const minting = (): (() => string) => {
  let next = 0;
  return () => `bbbbbbbb-bbbb-4bbb-8bbb-${String((next += 1)).padStart(12, "0")}`;
};

describe("a kept answer, made a placement's own", () => {
  it("gives the answer the id the placement was given, wherever its old one is written", () => {
    const kept = envelope("cart", A, `<label for="q-${A}">q</label><input id="q-${A}">`);
    const mine = reissueIds(kept, MINE, minting());
    expect(mine).not.toContain(A);
    expect(mine).toBe(
      envelope("cart", MINE, `<label for="q-${MINE}">q</label><input id="q-${MINE}">`),
    );
  });

  it("gives each assembly inside it an id of its own, the same one on its envelope and its island", () => {
    const kept = envelope(
      "shell",
      A,
      `${envelope("cart", B, "<p>1</p>")}${envelope("cart", B, "")}`,
    );
    const mine = reissueIds(kept, MINE, minting());
    const child = "bbbbbbbb-bbbb-4bbb-8bbb-000000000001";
    expect(mine).toBe(
      envelope(
        "shell",
        MINE,
        `${envelope("cart", child, "<p>1</p>")}${envelope("cart", child, "")}`,
      ),
    );
  });

  it("makes two placements of one kept answer two ids, and their children four", () => {
    const kept = envelope("shell", A, envelope("cart", B, ""));
    const mint = minting();
    const first = reissueIds(kept, MINE, mint);
    const second = reissueIds(kept, "cccccccc-cccc-4ccc-8ccc-cccccccccccc", mint);
    const ids = (html: string): string[] =>
      [...html.matchAll(/<assembly-root[^>]* data-id="([^"]+)"/g)].map((found) => found[1] ?? "");
    expect(new Set([...ids(first), ...ids(second)]).size).toBe(4);
  });

  it("leaves an id of another shape, which cannot be told from the text around it", () => {
    const kept = envelope("shell", A, envelope("theirs", "7", "<p>7 of 7</p>"));
    const mine = reissueIds(kept, MINE, minting());
    expect(mine).toBe(envelope("shell", MINE, envelope("theirs", "7", "<p>7 of 7</p>")));
    // And where the answer's own is of another shape, nothing takes the placement's.
    const odd = envelope("theirs", "7", envelope("cart", B, ""));
    expect(reissueIds(odd, MINE, minting())).toBe(
      envelope("theirs", "7", envelope("cart", "bbbbbbbb-bbbb-4bbb-8bbb-000000000001", "")),
    );
  });

  it("leaves markup with no envelope in it as it is", () => {
    expect(reissueIds(`<p>${A}</p>`, MINE, minting())).toBe(`<p>${A}</p>`);
  });
});
