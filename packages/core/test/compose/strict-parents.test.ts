// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { strictParents } from "@asmjs/core";

const at = (template: string) => strictParents(template)(template.indexOf("|"));

describe("where a template stands directly in a table's structure, or in a select", () => {
  it("is in a table outside its cells, named by the part it stands in", () => {
    expect(at("<table>|</table>")).toBe("table");
    expect(at("<table><thead>|</thead></table>")).toBe("thead");
    expect(at("<table><tbody><tr><td>a</td></tr>|</tbody></table>")).toBe("tbody");
    expect(at("<table><tr>|<td>a</td></tr></table>")).toBe("tr");
    expect(at("<table><colgroup>|</colgroup></table>")).toBe("colgroup");
    expect(at("<TABLE><TBODY><TR>|")).toBe("tr");
  });

  it("is nowhere of the kind inside a cell, a caption, or outside every table", () => {
    expect(at("<table><tr><td>|</td></tr></table>")).toBeUndefined();
    expect(at("<table><tr><th><b>|</b></th></tr></table>")).toBeUndefined();
    expect(at("<table><caption>|</caption></table>")).toBeUndefined();
    expect(at("<table><tr><td>a</td></tr></table>|")).toBeUndefined();
    expect(at("<main>|</main>")).toBeUndefined();
    // A row written with no table open is no row, and the parser ignores its tag.
    expect(at("<div><tr>|")).toBeUndefined();
  });

  it("follows the ends an author left out, and a table inside a cell", () => {
    expect(at("<table><tr><td>a<tr>|")).toBe("tr");
    expect(at("<table><tr><td>a<td>|")).toBeUndefined();
    expect(at("<table><tbody><tr><td>a<tfoot>|")).toBe("tfoot");
    expect(at("<table><tr><td><table>|</table></td></tr></table>")).toBe("table");
    expect(
      at("<table><tr><td><table><tr><td>x</td></tr></table>|</td></tr></table>"),
    ).toBeUndefined();
  });

  it("is anywhere in a select, and nowhere once it has ended", () => {
    expect(at("<select>|</select>")).toBe("select");
    expect(at("<select><optgroup><option>|</option></optgroup></select>")).toBe("select");
    expect(at("<select><option>a</option></select>|")).toBeUndefined();
  });

  it("reads no tag inside a comment or a raw-text element, and leaves a template's inside alone", () => {
    expect(at("<!-- <table> -->|")).toBeUndefined();
    expect(at("<script>'<table>'</script>|")).toBeUndefined();
    expect(at("<table><template>|</template></table>")).toBeUndefined();
  });

  it("is one pass, so ten thousand points are answered as fast as one", () => {
    const template = "<table>" + "<tr><td>cell</td></tr>".repeat(10_000) + "</table>";
    const began = performance.now();
    const read = strictParents(template);
    for (let point = 0; point < template.length; point += 20) read(point);
    expect(performance.now() - began).toBeLessThan(1000);
  });
});
