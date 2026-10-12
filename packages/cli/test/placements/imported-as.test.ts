// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { importedAs } from "@assemblejs/cli";

describe("the names a component imports a renderer's export under", () => {
  it("is the name itself, or what it is renamed to", () => {
    expect(
      importedAs('import { slot } from "@assemblejs/renderer-svelte/client";', "slot"),
    ).toEqual(["slot"]);
    expect(
      importedAs(
        `import { useEvents, Slot as Place } from '@assemblejs/renderer-vue/client';`,
        "Slot",
      ),
    ).toEqual(["Place"]);
  });

  it("is the name under a namespace, where the script imports the whole of the client", () => {
    const client = "@assemblejs/renderer-svelte/client";
    expect(importedAs(`import * as client from "${client}";`, "slot")).toEqual(["client.slot"]);
    expect(
      importedAs(`import { slot } from "${client}";\nimport * as c from "${client}";`, "slot"),
    ).toEqual(["slot", "c.slot"]);
    expect(importedAs('import * as ui from "./ui.js";', "slot")).toEqual([]);
  });

  it("is nothing for a type, another name, or the same name from somewhere else", () => {
    const client = "@assemblejs/renderer-vue/client";
    expect(importedAs(`import { type Slot } from "${client}";`, "Slot")).toEqual([]);
    expect(importedAs(`import { useEvents } from "${client}";`, "Slot")).toEqual([]);
    expect(importedAs('import { Slot } from "./slot.js";', "Slot")).toEqual([]);
  });
});
