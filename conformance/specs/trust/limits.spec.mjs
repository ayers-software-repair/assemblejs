// Copyright Ayers Electronics Inc. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
// DESIGN 3.4 and 14: a project sets how deep composition goes and how many placements one
// request composes in its config file, and the built server holds every page to them: a child
// one level past the depth is refused, and a placement numbered past the count is refused and
// accounted once.
import assert from "node:assert/strict";
import { test } from "node:test";
import { loggedLines, originOf, treeOf } from "../http.mjs";

const bounded = originOf("bounded");
const nameOf = (envelope) => envelope.attributes["data-name"];
const failed = (envelope) => envelope.attributes["data-failed"] !== undefined;

test("the page composes to the depth and the count the config file set, and no further", async () => {
  const page = await (await fetch(new URL("/", bounded))).text();
  const [chain, first, second] = treeOf(page);
  assert.deepEqual([chain, first, second].map(nameOf), ["chain", "hello", "hello"]);
  // One level deep: the chain is placed, and the hello its view places would be the second.
  assert.equal(failed(chain), false);
  assert.deepEqual(chain.children.map(nameOf), ["hello"]);
  assert.equal(failed(chain.children[0]), true, "the chain's child is past the depth");
  // Two placements a request: the chain and one hello; the third is past the count.
  assert.equal(failed(first), false);
  assert.equal(failed(second), true, "the third placement is past the count");
  assert.match(page, /hello from the bounded project/);
  const [line] = await loggedLines(
    (written) => String(written.message).includes("refused after too-many"),
    1,
    "bounded",
  );
  assert.match(
    String(line?.message),
    /^1 placements on page "\/" were refused after too-many, the first of them "hello"$/,
  );
});
