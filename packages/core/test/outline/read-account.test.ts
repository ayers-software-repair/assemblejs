// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { OUTLINE_ATTRIBUTE } from "@asmjs/core";
import { readAccount } from "@asmjs/core/outline";

const block = (account: unknown): string =>
  `<script type="application/json" ${OUTLINE_ATTRIBUTE}>${JSON.stringify(account)}</script>`;
const row = { id: "a", name: "cart", view: "default", source: "local", ms: 3 };

describe("reading the account a server wrote of its page", () => {
  it("reads the route, the time and every placement, at any depth", () => {
    const account = {
      route: "/shop",
      ms: 12,
      placements: [{ ...row, children: [{ ...row, id: "b" }] }],
    };
    document.body.innerHTML = `<main></main>${block(account)}`;
    expect(readAccount(document)).toEqual(account);
  });

  it("is undefined on a page with none, and on one whose block is not an account", () => {
    document.body.innerHTML = "<main></main>";
    expect(readAccount(document)).toBeUndefined();
    document.body.innerHTML = `<script type="application/json" ${OUTLINE_ATTRIBUTE}>{not json</script>`;
    expect(readAccount(document)).toBeUndefined();
    document.body.innerHTML = block(["a", "list"]);
    expect(readAccount(document)).toBeUndefined();
  });

  // An envelope holds what an assembly sent, another server's included.
  it("passes over a block inside an envelope, which is an assembly's word and not the server's", () => {
    const forged = { route: "/forged", ms: 0, placements: [] };
    document.body.innerHTML = `<assembly-root data-remote="https://b.example">${block(forged)}</assembly-root>`;
    expect(readAccount(document)).toBeUndefined();
    document.body.innerHTML += block({ route: "/", ms: 1, placements: [] });
    expect(readAccount(document)?.route).toBe("/");
  });

  it("leaves out a row that is not a row, and a field that is not what it should be", () => {
    document.body.innerHTML = block({
      route: 7,
      ms: "slow",
      placements: [
        row,
        "cart",
        { ...row, id: 3 },
        { ...row, source: "guess" },
        { ...row, id: "c", browser: "yes", refused: "2", children: "none", cause: "hunter2" },
      ],
    });
    expect(readAccount(document)).toEqual({
      route: "",
      ms: 0,
      placements: [row, { ...row, id: "c" }],
    });
  });
});
