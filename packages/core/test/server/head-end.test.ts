// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { headEnd } from "@assemblejs/core";

describe("where something for a document's head goes", () => {
  it("is before the first closing head tag the browser reads as one", () => {
    expect(headEnd("<head><!-- </head> --></head>")).toBe("<head><!-- </head> -->".length);
  });

  it("is after the doctype of a template with no head, which keeps it out of quirks mode", () => {
    expect(headEnd("\n<!DOCTYPE html><title>x</title>")).toBe("\n<!DOCTYPE html>".length);
  });

  it("is the very start of a template with neither", () => {
    expect(headEnd("<p>x</p>")).toBe(0);
  });
});
