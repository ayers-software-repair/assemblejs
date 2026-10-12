// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { aRenderer } from "@assemblejs/cli";

describe("a renderer's name, with the article it is said with", () => {
  it("is said with an where the name begins with a vowel's sound, and with a otherwise", () => {
    expect(["ejs", "html", "react", "handlebars", "svelte", "vue"].map(aRenderer)).toEqual([
      "an ejs",
      "an html",
      "a react",
      "a handlebars",
      "a svelte",
      "a vue",
    ]);
  });
});
