// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 10: a new project starts with its tokens, one stylesheet every page links before any
// assembly's, carried whole into the build and named by its content.
import assert from "node:assert/strict";
import { test } from "node:test";
import { originOf } from "../http.mjs";

const written = originOf("written");

test("every page links the project's tokens first, and the build serves them whole", async () => {
  const page = await (await fetch(new URL("/", written))).text();
  const links = [...page.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
  assert.ok(links.length > 0, "the page links no stylesheet");
  assert.match(links[0], /^\/_assemblejs\/assets\/styles\/tokens-[0-9a-f]{8}\.css$/);
  const sheet = await fetch(new URL(links[0], written));
  assert.equal(sheet.status, 200);
  assert.match(sheet.headers.get("content-type") ?? "", /^text\/css/);
  const css = await sheet.text();
  assert.match(css, /:root \{/);
  assert.match(css, /--ink: #/);
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.ok(!css.includes("assembly-root"), "the tokens were scoped to an envelope");
});
