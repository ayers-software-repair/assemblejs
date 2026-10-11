// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 5.1 and 8: the page's query reaches a remote declared trusted, on the content url it is
// asked at, and that server's service reads it as it reads any query. The hostile remote,
// declared and not trusted, is held away from the query in outbound.spec.mjs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { envelopesOf, get, originOf } from "../http.mjs";

test("a page's query reaches the service of an assembly placed from a trusted remote", async () => {
  const response = await get("/trusted?note=hello%20there");
  assert.equal(response.status, 200);
  const [echo] = envelopesOf(await response.text());
  assert.equal(echo?.attributes["data-remote"], originOf("producer"));
  assert.match(echo?.inner ?? "", /<p class="echo">hello there<\/p>/);
  // Asked with no query, the service sees none.
  const [bare] = envelopesOf(await (await get("/trusted")).text());
  assert.match(bare?.inner ?? "", /<p class="echo">nothing<\/p>/);
});
