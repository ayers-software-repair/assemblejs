// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { styleReferences } from "@assemblejs/cli";

describe("the files a CSS value names beside its stylesheet", () => {
  it("finds a relative url however it is quoted", () => {
    expect(
      styleReferences(`url(./bg.png) no-repeat, url("img/a b.svg#x"), url( 'c.woff2' )`),
    ).toEqual(["./bg.png", "img/a b.svg#x", "c.woff2"]);
  });

  it("leaves what the browser resolves the same anywhere", () => {
    expect(
      styleReferences(
        "url(data:image/png;base64,AA) url(https://cdn.example/x.png) url(//cdn.example/y.png) url(/root.png) url(#clip) url()",
      ),
    ).toEqual([]);
  });
});
