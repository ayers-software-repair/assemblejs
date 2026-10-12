// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { COMPUTED_MARKER, svelteElements } from "@assemblejs/cli";

const shown = (source: string) =>
  svelteElements(source).map((element) => ({
    tag: element.tag,
    attributes: [...element.attributes],
    computed: element.computed,
  }));

describe("the elements a Svelte component's markup writes", () => {
  it("reads the markup outside script and style, an expression as the marker, a block as text", () => {
    const source = `<script lang="ts">let src = "a.png"; const rest = {};</script>
{#if shown}
  <img src={src} alt="" />
{:else}
  <input type="text" {...rest} />
{/if}
<p>{greeting} and {a ? {b: 1}.b : 2}</p>
<style>p { color: var(--ink); }</style>`;
    expect(shown(source)).toEqual([
      {
        tag: "img",
        attributes: [
          ["src", COMPUTED_MARKER],
          ["alt", ""],
        ],
        computed: true,
      },
      {
        tag: "input",
        attributes: [
          ["type", "text"],
          [COMPUTED_MARKER, true],
        ],
        computed: true,
      },
      { tag: "p", attributes: [], computed: false },
    ]);
  });

  it("reads a component with no markup as writing no element", () => {
    expect(svelteElements("<script>const n = 1</script>")).toEqual([]);
  });
});
