// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { test } from "node:test";
import { Window } from "happy-dom";
import { verifyManualEdit } from "./verify-manual-edit.js";

test("manual edit evidence requires matching saved and served labels at the same revision", async () => {
  const window = new Window();
  const preview = { version: "123456789abc", url: "http://127.0.0.1:8080/p/kb-guji-250" };
  let version = preview.version;
  const client = {
    async callTool({ name, arguments: args }) {
      const result =
        name === "read_source_version"
          ? { version }
          : { path: args.path, contents: "<button>Add to bag</button>" };
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true, result, problems: [] }) }],
      };
    },
  };
  const page = (label) => ({
    url: preview.url,
    html:
      "<assembly-root data-name='buy-box'><aside class='buy'><button>" +
      label +
      "</button></aside></assembly-root>",
  });
  const check = (read) =>
    verifyManualEdit(window.document, client, preview, read, new AbortController().signal);
  try {
    await assert.rejects(
      check(async () => page("Add to basket")),
      /served buy box/,
    );
    await assert.rejects(
      check(async () => ({
        url: preview.url,
        html: "<aside class='buy'><button>Add to bag</button></aside>",
      })),
      /buy-box assembly/,
    );
    const evidence = await check(async () => page("Add to bag"));
    assert.equal(evidence.lesson, "edit-content");
    assert.equal(evidence.version, preview.version);
    await assert.rejects(
      check(async () => {
        version = "abcdef123456";
        return page("Add to bag");
      }),
      /no longer matches/,
    );
  } finally {
    window.close();
  }
});
