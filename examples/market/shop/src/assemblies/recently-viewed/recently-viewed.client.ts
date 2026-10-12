// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { viewed } from "../../browser/viewed.js";

// What this browser was last shown, which only the browser knows. The server sends the empty
// frame; this fills it once the assembly scrolls into view, and leaves it hidden when there is
// nothing to say. Links are built as elements and text, never as markup.
export default {
  mount(element: Element | ShadowRoot) {
    const section = element.querySelector("section");
    const list = element.querySelector("ul");
    const here = location.pathname.split("/").pop();
    const seen = viewed.read().filter((one) => one.sku !== here);
    if (section === null || list === null || seen.length === 0) return { unmount: () => undefined };
    list.replaceChildren(
      ...seen.map((one) => {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = `/p/${encodeURIComponent(one.sku)}`;
        link.textContent = one.name;
        item.append(link);
        return item;
      }),
    );
    section.hidden = false;
    return { unmount: () => list.replaceChildren() };
  },
};
