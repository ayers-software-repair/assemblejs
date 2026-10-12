// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { shadowTemplates } from "@assemblejs/core";

const inside = (template: string) => shadowTemplates(template)(template.indexOf("|"));

describe("where a template stands inside an element's own declarative shadow root", () => {
  it("is inside a template that names its shadow root mode, until that template closes", () => {
    expect(inside('<x-el><template shadowrootmode="open">in |</template></x-el>')).toBe(true);
    expect(inside('<x-el><TEMPLATE shadowroot="open" shadowrootmode="open">|')).toBe(true);
    expect(inside('<x-el><template shadowrootmode="open"><template><p>deep |</p></template>')).toBe(
      true,
    );
    expect(inside('<x-el><template shadowrootmode="open">in</template> |</x-el>')).toBe(false);
  });

  it("is not inside a plain template, nor before any, nor one in a comment", () => {
    expect(inside("<template>plain |</template>")).toBe(false);
    expect(inside('| <template shadowrootmode="open"></template>')).toBe(false);
    expect(inside('<!-- <template shadowrootmode="open"> --> |')).toBe(false);
    expect(inside('<template shadowrootmode="open"><template></template>|</template>')).toBe(true);
  });

  it("is not inside an element whose name only begins like a template's", () => {
    expect(inside('<template-card shadowrootmode="open">|</template-card>')).toBe(false);
  });
});
