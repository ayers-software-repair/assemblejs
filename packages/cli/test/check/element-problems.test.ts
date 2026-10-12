// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discoverAssemblies, elementProblems } from "@assemblejs/cli";

let root = "";
afterEach(() => rmSync(root, { recursive: true, force: true }));
const problems = (files: Readonly<Record<string, string>>) => {
  root = mkdtempSync(join(tmpdir(), "element-problems-"));
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return elementProblems(root, discoverAssemblies(root).assemblies);
};

describe("a view has no inline style", () => {
  it("refuses a style attribute in any kind of view, written or computed, naming the element", () => {
    const found = problems({
      "src/assemblies/card/card.html": '<p style="color: red">x</p>',
      "src/assemblies/note/note.ejs": '<section style="<%= tone %>">y</section>',
      "src/assemblies/counter/counter.react.tsx":
        "export default () => <button style={{ color: 'red' }}>0</button>;",
      "src/assemblies/panel/panel.vue": '<template><div :style="look"></div></template>',
      "src/assemblies/tag/tag.svelte": "<b style={look}>t</b>",
    });
    expect(found.map((one) => one.rule)).toEqual(found.map(() => "a-view-has-no-inline-style"));
    expect(found.map((one) => one.message).sort()).toEqual([
      '"card" writes a style attribute on <p>, which the default policy does not apply and which sets a value where it is used',
      '"counter" writes a style attribute on <button>, which the default policy does not apply and which sets a value where it is used',
      '"note" writes a style attribute on <section>, which the default policy does not apply and which sets a value where it is used',
      '"panel" writes a style attribute on <div>, which the default policy does not apply and which sets a value where it is used',
      '"tag" writes a style attribute on <b>, which the default policy does not apply and which sets a value where it is used',
    ]);
    expect(found[0]?.fix).toContain(".css file in the assembly's directory");
  });

  it("refuses an img with no alt at all, in any kind of view, and passes an empty, a computed, or a spread one", () => {
    const found = problems({
      "src/assemblies/photo/photo.html": '<img src="a.png"><img src="b.png" alt="">',
      "src/assemblies/hero/hero.react.tsx":
        'export default (p: { readonly alt: string; readonly rest: object }) => <><img src="c.png" /><img src="d.png" alt={p.alt} /><img {...p.rest} /></>;',
      "src/assemblies/logo/logo.svelte": '<img src={src} alt={alt} /><img src="e.png" />',
    });
    expect(found.map((one) => [one.rule, one.message]).sort()).toEqual([
      [
        "an-image-has-an-alternative",
        '"hero" writes an <img> with no alt, so what it shows has no text alternative',
      ],
      [
        "an-image-has-an-alternative",
        '"logo" writes an <img> with no alt, so what it shows has no text alternative',
      ],
      [
        "an-image-has-an-alternative",
        '"photo" writes an <img> with no alt, so what it shows has no text alternative',
      ],
    ]);
    expect(found[0]?.fix).toContain('alt="" if it is decoration');
  });

  it("refuses a control with no name in any kind of view, and passes one a label names or wraps", () => {
    const found = problems({
      "src/assemblies/form/form.html":
        '<label for="n">Name</label><input id="n"><select id="s"></select><label><textarea></textarea></label>',
      "src/assemblies/search/search.react.tsx":
        'export default (p: { readonly rest: object }) => <><input type="search" aria-label="Search" /><input type="hidden" /><textarea id="t" /><input {...p.rest} /></>;',
      "src/assemblies/pick/pick.vue":
        '<template><label :for="id">P</label><select :id="id"></select></template>',
    });
    expect(found.map((one) => [one.rule, one.message]).sort()).toEqual([
      [
        "a-control-has-a-name",
        '"form" writes a control, <select>, with no name: no label for it, and no aria-label or title',
      ],
      [
        "a-control-has-a-name",
        '"search" writes a control, <textarea>, with no name: no label for it, and no aria-label or title',
      ],
    ]);
    expect(found[0]?.fix).toContain("<label for> it");
  });

  it("is quiet for views with a class and no style, and for a view it cannot read", () => {
    expect(
      problems({
        "src/assemblies/card/card.html": '<p class="notice">x</p>',
        "src/assemblies/broken/broken.react.tsx": "export default (",
      }),
    ).toEqual([]);
  });
});
